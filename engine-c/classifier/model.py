"""Real multi-label compliance-risk model, trained on the CPSC recalls corpus.

For each regulatory category with enough real positive examples, we train a
CatBoost classifier over the recall text (title + description + hazard +
product type) and report its PR-AUC (average precision) under stratified
cross-validation. PR-AUC, not ROC-AUC, because positives are a minority and ROC
is misleadingly high there (CLAUDE.md section 5 / 14).

Inference on a garment builds the same kind of text from its archetype + fiber
composition and asks each per-label model for a calibrated risk. The garment
never carries a hand-set probability.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd
from catboost import CatBoostClassifier, Pool
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import StratifiedKFold

# The label is derived (in the ETL) from these very terms, so they must be
# stripped from the FEATURES or the model just relearns the labeling keyword and
# reports a meaningless ~1.0 PR-AUC. With them gone, the model must predict the
# hazard category from genuine correlates (product type, brand, co-occurring
# language) — the honest, credible task, simulating an unlabeled incoming product.
_LABEL_TERMS = re.compile(
    r"\b(lead|cadmium|phthalate\w*|flammab\w*|burn\w*|sleepwear|fire|drawstring\w*|"
    r"strangulat\w*|formaldehyde|pfas|fluorinat\w*|azo|aromatic amines?)\b"
)


def _strip_label_terms(text: str) -> str:
    return _LABEL_TERMS.sub(" ", text)

# Categories with enough real CPSC positives to train an honest model. Sparse
# categories (formaldehyde, PFAS, amines barely appear in apparel recalls) are
# handled by the deterministic rule layer instead, never faked by the model.
TRAINABLE_LABELS = [
    "CPSIA_FLAMMABILITY_SLEEPWEAR",
    "CPSIA_DRAWSTRING_1610",
    "CPSIA_LEAD_SUBSTRATE",
]

_TEXT_COL = "text"


def _corpus_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "datasets" / "cpsc_recalls.parquet"


def load_corpus() -> pd.DataFrame:
    df = pd.read_parquet(_corpus_path())
    # Labels come from regulatory_categories (computed in the ETL). The FEATURE
    # text strips the label-defining keywords so the model cannot cheat.
    for label in TRAINABLE_LABELS:
        df[label] = df["regulatory_categories"].map(lambda cs: int(label in cs))
    raw = (
        df["title"].fillna("")
        + " . "
        + df["description"].fillna("")
        + " . "
        + df["hazard"].fillna("")
        + " . "
        + df["product_types"].fillna("")
    ).str.lower()
    df[_TEXT_COL] = raw.map(_strip_label_terms)
    return df


def _make_model(seed: int = 13) -> CatBoostClassifier:
    return CatBoostClassifier(
        iterations=350,
        depth=4,
        learning_rate=0.08,
        loss_function="Logloss",
        text_features=[_TEXT_COL],
        verbose=False,
        random_seed=seed,
        allow_writing_files=False,
    )


@dataclass
class LabelModel:
    label: str
    pr_auc: float
    auc: float
    positives: int
    n: int
    model: CatBoostClassifier
    _baseline: float = 0.0


@dataclass
class ComplianceModel:
    labels: dict[str, LabelModel] = field(default_factory=dict)

    def predict_risk(self, text: str) -> dict[str, float]:
        out: dict[str, float] = {}
        for label, lm in self.labels.items():
            pool = Pool(data=pd.DataFrame({_TEXT_COL: [text.lower()]}), text_features=[_TEXT_COL])
            out[label] = float(lm.model.predict_proba(pool)[0, 1])
        return out

    def recall_count(self) -> int:
        """The real number of CPSC recalls the model trained on (every LabelModel
        carries the same corpus size n). Falls back to re-counting the corpus if no
        label trained, so the manifest's recallCount is never fabricated."""
        if self.labels:
            return next(iter(self.labels.values())).n
        return len(load_corpus())

    def pr_auc(self, label: str) -> float:
        return self.labels[label].pr_auc if label in self.labels else float("nan")

    def auc(self, label: str) -> float:
        return self.labels[label].auc if label in self.labels else float("nan")


def _cv_score(df: pd.DataFrame, label: str, folds: int = 5) -> tuple[float, float]:
    """Out-of-fold PR-AUC and ROC-AUC on real data, so the reported number is
    honest (not training-set optimism)."""
    X = df[[_TEXT_COL]].reset_index(drop=True)
    y = df[label].to_numpy()
    oof = np.zeros(len(y), dtype=float)
    skf = StratifiedKFold(n_splits=folds, shuffle=True, random_state=7)
    for tr, te in skf.split(X, y):
        m = _make_model()
        m.fit(Pool(X.iloc[tr], y[tr], text_features=[_TEXT_COL]))
        oof[te] = m.predict_proba(Pool(X.iloc[te], text_features=[_TEXT_COL]))[:, 1]
    return float(average_precision_score(y, oof)), float(roc_auc_score(y, oof))


def train() -> ComplianceModel:
    df = load_corpus()
    cm = ComplianceModel()
    n = len(df)
    print(f"training Engine C risk model on {n} real CPSC recalls")
    for label in TRAINABLE_LABELS:
        pos = int(df[label].sum())
        if pos < 10:
            print(f"  skip {label}: only {pos} positives")
            continue
        pr_auc, auc = _cv_score(df, label)
        full = _make_model()
        full.fit(Pool(df[[_TEXT_COL]], df[label].to_numpy(), text_features=[_TEXT_COL]))
        cm.labels[label] = LabelModel(
            label=label, pr_auc=pr_auc, auc=auc, positives=pos, n=n,
            model=full, _baseline=pos / n,
        )
        print(f"  {label:34s} pos={pos:4d}  PR-AUC={pr_auc:.3f}  ROC-AUC={auc:.3f}  base={pos / n:.3f}")
    return cm


if __name__ == "__main__":
    train()
