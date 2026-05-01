import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "../dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("❌ dist/index.html not found. Run `npm run build` first.");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

// Inline CSS
html = html.replace(
  /<link[^>]+href="([^"]+\.css)"[^>]*>/g,
  (_, href) => {
    const cssPath = path.join(distDir, href.replace(/^\//, ""));
    const css = fs.readFileSync(cssPath, "utf8");
    return `<style>\n${css}\n</style>`;
  }
);

// Inline JS (module)
html = html.replace(
  /<script[^>]+type="module"[^>]+src="([^"]+\.js)"[^>]*><\/script>/g,
  (_, src) => {
    const jsPath = path.join(distDir, src.replace(/^\//, ""));
    const js = fs.readFileSync(jsPath, "utf8");
    return `<script type="module">\n${js}\n</script>`;
  }
);

// Inline JS (non-module)
html = html.replace(
  /<script(?![^>]*type="module")[^>]+src="([^"]+\.js)"[^>]*><\/script>/g,
  (_, src) => {
    const jsPath = path.join(distDir, src.replace(/^\//, ""));
    const js = fs.readFileSync(jsPath, "utf8");
    return `<script>\n${js}\n</script>`;
  }
);

const outPath = path.resolve(__dirname, "../onefile.html");
fs.writeFileSync(outPath, html, "utf8");

console.log("✅ onefile.html created!");