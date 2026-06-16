"use client";

import { useEffect, useRef, useState } from "react";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { DefaultPluginSpec } from "molstar/lib/mol-plugin/spec";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { Color } from "molstar/lib/mol-util/color";
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";

/**
 * Imperative, headless Mol* viewer. Loads a structure, sets the dark instrument
 * background, optionally paints a catalytic active site (given residues) in
 * ball-and-stick, and gently auto-rotates once the camera has framed the scene.
 * Dynamic-import with ssr:false so molstar never evaluates on the server.
 */
export default function MolstarViewer({
  url,
  className,
  activeSite,
  chain = "A",
}: {
  url: string;
  className?: string;
  activeSite?: number[];
  chain?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    let plugin: PluginContext | null = null;

    (async () => {
      const parent = parentRef.current;
      const canvas = canvasRef.current;
      if (!parent || !canvas) return;

      const spec = {
        ...DefaultPluginSpec(),
        config: [[PluginConfig.VolumeStreaming.Enabled, false]] as [
          typeof PluginConfig.VolumeStreaming.Enabled,
          boolean,
        ][],
      };
      plugin = new PluginContext(spec);
      await plugin.init();
      if (disposed) {
        plugin.dispose();
        return;
      }

      const ok = await plugin.initViewerAsync(canvas, parent);
      if (!ok) {
        setStatus("error");
        return;
      }
      if (disposed) return; // clean unmount mid-init, not a failure

      const renderer = plugin.canvas3d!.props.renderer;
      await PluginCommands.Canvas3D.SetSettings(plugin, {
        settings: { renderer: { ...renderer, backgroundColor: Color(0x0e1116) } },
      });

      // infer format from the url so a pre-converted BinaryCIF (.bcif) at the
      // artifact-freeze gate loads correctly instead of being fetched as text
      const isBinary = url.endsWith(".bcif");
      const data = await plugin.builders.data.download(
        { url, isBinary },
        { state: { isGhost: true } },
      );
      const trajectory = await plugin.builders.structure.parseTrajectory(
        data,
        isBinary ? "mmcif" : "pdb",
      );
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, "default");

      // Active-site licorice on the given residues (e.g. the Ser-His-Asp triad).
      if (activeSite && activeSite.length > 0) {
        const structure = plugin.managers.structure.hierarchy.current.structures[0];
        if (structure) {
          const expr = MS.struct.combinator.merge(
            activeSite.map((res) =>
              MS.struct.generator.atomGroups({
                "chain-test": MS.core.rel.eq([
                  MS.struct.atomProperty.macromolecular.auth_asym_id(),
                  chain,
                ]),
                "residue-test": MS.core.rel.eq([
                  MS.struct.atomProperty.macromolecular.auth_seq_id(),
                  res,
                ]),
              }),
            ),
          );
          const comp = await plugin.builders.structure.tryCreateComponentFromExpression(
            structure.cell,
            expr,
            "active-site",
            { label: "Catalytic triad" },
          );
          if (comp) {
            await plugin.builders.structure.representation.addRepresentation(comp, {
              type: "ball-and-stick",
              // emissive flag (ball-and-stick PD.Numeric) so the triad is the
              // one thing the emissive-mode bloom below energizes
              typeParams: { emissive: 0.85 },
              color: "uniform",
              colorParams: { value: Color(0x34e0c4) },
            });
          }
        }
      }

      // Selective emissive bloom: only the emissive-flagged catalytic triad
      // glows bio-green, pulling the eye to the active site (the grand-prize
      // moment). Isolated in its own try/catch and grounded in the installed
      // molstar 5.9 param shapes, so a mismatch or weak GPU degrades to the
      // plain cartoon, never a dead viewer.
      try {
        const pp = plugin.canvas3d!.props.postprocessing;
        await PluginCommands.Canvas3D.SetSettings(plugin, {
          settings: {
            postprocessing: {
              ...pp,
              bloom: {
                name: "on",
                params: { strength: 1.0, radius: 0.85, threshold: 0, mode: "emissive" },
              },
            },
          },
        });
      } catch {
        // bloom unsupported here; the cartoon still renders fine
      }

      // Contact-shadow depth (SSAO) on the cartoon, in its OWN try/catch so a
      // param mismatch cannot take down the bloom above. Explicit full params
      // (the molstar 5.9 occlusion shape), not a merge default.
      try {
        const pp2 = plugin.canvas3d!.props.postprocessing;
        await PluginCommands.Canvas3D.SetSettings(plugin, {
          settings: {
            postprocessing: {
              ...pp2,
              occlusion: {
                name: "on",
                params: {
                  samples: 32,
                  multiScale: { name: "off", params: {} },
                  radius: 5,
                  bias: 0.8,
                  blurKernelSize: 15,
                  blurDepthBias: 0.5,
                  resolutionScale: 1,
                  color: Color(0x000000),
                  transparentThreshold: 0.4,
                },
              },
            },
          },
        });
      } catch {
        // SSAO unsupported here; bloom + cartoon still render
      }

      // Frame the structure. Auto-spin is intentionally omitted: Mol*'s trackball
      // spin tick throws every frame in this build, so drag-to-rotate is the
      // interaction. The camera reset gives a clean initial framing.
      plugin.canvas3d?.requestCameraReset();

      if (!disposed) setStatus("ready");
    })().catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[molstar] viewer init failed", err);
      }
      if (!disposed) setStatus("error");
    });

    return () => {
      disposed = true;
      plugin?.dispose();
    };
  }, [url, activeSite, chain]);

  return (
    <div ref={parentRef} data-molstar className={className} style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {status !== "ready" && (
        <div className="mono-label absolute inset-0 grid place-items-center">
          {status === "error" ? "viewer unavailable" : "initializing viewer"}
        </div>
      )}
    </div>
  );
}
