// Vite handles the React app, tests, and the local PDF compile endpoint in dev.
// Vite handles the React app, tests, and the local PDF compile endpoint in dev.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import os from "node:os";
import { spawn } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdflatexPath = path.resolve(
  __dirname,
  "../Dr Demic Project/qcl_characterization_manager-main/lib/miktex-portable/texmfs/install/miktex/bin/x64/pdflatex.exe",
);

function validateLatexSource(texSource) {
  const blockedPatterns = [
    /\\write18\b/i,
    /\\input\b/i,
    /\\include\b/i,
    /\\openin\b/i,
    /\\openout\b/i,
    /\\read\b/i,
    /\\usepackage\s*\{[^}]*shellesc[^}]*\}/i,
    /\\catcode\b/i,
    /\\csname\b/i,
    /\\newread\b/i,
    /\\newwrite\b/i,
  ];

  return !blockedPatterns.some((pattern) => pattern.test(texSource));
}

function reportPdfPlugin() {
  return {
    name: "local-report-pdf",
    configureServer(server) {
      server.middlewares.use("/api/report/pdf", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }

          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const texSource = typeof payload.texSource === "string" ? payload.texSource : "";
          const stemCandidate = typeof payload.fileStem === "string" ? payload.fileStem : "qcl_report";
          const fileStem = stemCandidate.replace(/[^A-Za-z0-9._-]/g, "_") || "qcl_report";
          const figures = Array.isArray(payload.figures) ? payload.figures : [];

          if (!texSource.trim()) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing LaTeX source." }));
            return;
          }

          if (!validateLatexSource(texSource)) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "The LaTeX source contains blocked commands." }));
            return;
          }

          await fs.access(pdflatexPath);

          const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "qcl-report-"));
          const datasheetDir = path.join(rootDir, `${fileStem}_datasheet`);
          const figuresDir = path.join(rootDir, "Figures");
          await fs.mkdir(datasheetDir, { recursive: true });
          await fs.mkdir(figuresDir, { recursive: true });

          for (const figure of figures) {
            if (
              !figure ||
              typeof figure.fileName !== "string" ||
              !/^[A-Za-z0-9._-]+\.(pdf|png)$/i.test(figure.fileName) ||
              typeof figure.base64 !== "string"
            ) {
              continue;
            }

            const figurePath = path.join(figuresDir, figure.fileName);
            await fs.writeFile(figurePath, Buffer.from(figure.base64, "base64"));
          }

          const texPath = path.join(datasheetDir, `${fileStem}.tex`);
          const pdfPath = path.join(datasheetDir, `${fileStem}.pdf`);

          await fs.writeFile(texPath, texSource, "utf8");

          const compile = () =>
            new Promise((resolve, reject) => {
              const process = spawn(pdflatexPath, ["-interaction=nonstopmode", "-no-shell-escape", `${fileStem}.tex`], {
                cwd: datasheetDir,
                stdio: ["ignore", "pipe", "pipe"],
              });

              let stdout = "";
              let stderr = "";

              process.stdout.on("data", (chunk) => {
                stdout += chunk.toString();
              });

              process.stderr.on("data", (chunk) => {
                stderr += chunk.toString();
              });

              process.on("error", reject);
              process.on("close", (code) => {
                if (code === 0) {
                  resolve();
                  return;
                }

                reject(new Error((stderr || stdout || `pdflatex failed with code ${code}`).slice(0, 3000)));
              });
            });

          await compile();
          const pdfBuffer = await fs.readFile(pdfPath);

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${fileStem}.pdf"`);
          res.end(pdfBuffer);

          void fs.rm(rootDir, { recursive: true, force: true });
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to compile report PDF.",
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), reportPdfPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
