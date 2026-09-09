// forked from design-sync lib/css.mjs - Vite가 빌드한 CSS는 폰트 url()을
// 사이트 루트 기준 절대경로("/assets/xxx.woff2", "/fonts/xxx.woff2")로 씀.
// 원본 extractFonts는 이런 절대경로를 resolve(srcDir, url)로 처리하는데,
// Node의 path.resolve는 "/"로 시작하는 두 번째 인자를 "현재 드라이브의
// 루트"로 취급해버려서(Windows에서 C:\assets\xxx.woff2 같은, 실제로는
// 존재하지 않는 경로가 됨) 모든 폰트 파일을 못 찾고 건너뛰게 됨
// (검증 시 [FONT_DANGLING]로 나타남). srcDir과 그 상위 폴더들을 위로
// 올라가며 "루트 절대경로를 상대경로로 다시 붙여본" 후보를 추가로
// 시도하도록 고쳤다 - Vite 빌드 산출물(dist/)처럼 CSS 파일이 사이트
// 루트의 하위 폴더에 있는 흔한 배치를 커버함.
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { ls } from '../../.ds-sync/lib/common.mjs';

export function extractFonts(cssPath, srcDir, { fontsOut, roots }) {
  const realOf = (p) => { try { return realpathSync(p); } catch { return null; } };
  const rootsReal = (Array.isArray(roots) ? roots : [roots]).map((r) => realOf(resolve(r)) ?? resolve(r));
  const insideRoots = (p) => rootsReal.some((root) => {
    const rel = relative(root, p);
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
  });
  if (!existsSync(cssPath)) return [];
  const css = readFileSync(cssPath, 'utf8');
  const rules = [];

  // 사이트 루트 절대경로("/assets/x.woff2")용 후보 나열: srcDir부터 위로
  // 올라가며 "<ancestor><url>"이 실제로 존재하는지 확인 (최대 6단계 -
  // 리포 최상단을 넘어가면 무의미하므로 방어적으로 상한을 둠).
  function candidatesForAbsoluteUrl(u) {
    const tail = u.replace(/^\//, '');
    const out = [];
    let dir = srcDir;
    for (let i = 0; i < 6; i++) {
      out.push(join(dir, tail));
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return out;
  }

  for (const m of css.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
    const body = m[1];
    const fam = body.match(/font-family\s*:\s*['"]?([^;'"\n]+)['"]?/)?.[1]?.trim();
    const urls = [...body.matchAll(/url\(\s*['"]?([^'")]+?\.(?:woff2?|ttf|otf))['"]?\s*\)/gi)].map((u) => u[1]);
    if (!fam || !urls.length) continue;
    let rewritten = body;
    for (const u of urls) {
      if (/^(https?:|data:)/.test(u)) continue; // CDN / inline - leave as-is
      const candidates = u.startsWith('/')
        ? candidatesForAbsoluteUrl(u)
        : [resolve(srcDir, u.replace(/^\.\//, ''))];
      let real = null;
      for (const c of candidates) {
        const r = realOf(c);
        if (r && insideRoots(r)) { real = r; break; }
      }
      if (!real) continue;
      const name = basename(real);
      mkdirSync(fontsOut, { recursive: true });
      cpSync(real, join(fontsOut, name));
      rewritten = rewritten.split(u).join(`./${name}`);
    }
    rules.push(`@font-face{${rewritten}}`);
  }
  return rules;
}

// 아래는 원본과 동일 (수정 없음) - forked from design-sync lib/css.mjs
export function copyTokens({ tokensPkg, tokensGlob, nodeModules, out }) {
  const tokenFiles = [];
  if (!tokensPkg) return tokenFiles;
  const tdir = join(nodeModules, tokensPkg);
  const tjson = JSON.parse(readFileSync(join(tdir, 'package.json'), 'utf8'));
  if (tokensGlob) {
    const parts = tokensGlob.split('/');
    const pat = parts.pop();
    const rx = new RegExp('^' + pat.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    const deep = parts.includes('**');
    const base = join(tdir, ...parts.filter((p) => p !== '**'));
    (function collect(d, rel = '') {
      if (!existsSync(d)) return;
      for (const e of ls(d, { withFileTypes: true })) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory() && deep) collect(join(d, e.name), r);
        else if (e.isFile() && rx.test(e.name)) {
          mkdirSync(dirname(join(out, 'tokens', r)), { recursive: true });
          cpSync(join(d, e.name), join(out, 'tokens', r));
          tokenFiles.push(r);
        }
      }
    })(base);
  } else {
    for (const sub of ['dist/css', 'css', 'dist', '.']) {
      const d = join(tdir, sub);
      if (!existsSync(d)) continue;
      for (const f of ls(d)) {
        if (f.endsWith('.css')) {
          cpSync(join(d, f), join(out, 'tokens', f));
          tokenFiles.push(f);
        }
      }
      if (tokenFiles.length) break;
    }
  }
  console.error(`  tokens: ${tokenFiles.length} files from ${tokensPkg}@${tjson.version}`);
  return tokenFiles;
}

export function rewriteBundleFontFaces({ out, bundleCss }) {
  const p = bundleCss ?? join(out, '_ds_bundle.css');
  let css;
  try { css = readFileSync(p, 'utf8'); } catch { return; }
  if (!/@font-face/i.test(css)) return;
  let dropped = 0, rewrote = 0;
  const next = css.replace(/@font-face\s*\{[^}]*\}/gi, (block) => {
    let b = block;
    for (const m of block.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) {
      const u = m[1];
      if (/^(?:https?:|data:|\.\/fonts\/)/.test(u)) continue;
      const name = basename(u.split(/[?#]/)[0]);
      if (existsSync(join(out, 'fonts', name))) { b = b.split(u).join(`./fonts/${name}`); rewrote++; }
    }
    if (/url\(\s*['"]?(?!https?:|data:|\.\/fonts\/)/i.test(b)) { dropped++; return '/* @ds-font-face-dropped: unresolvable src */'; }
    return b;
  });
  if (rewrote || dropped) {
    writeFileSync(p, next);
    console.error(`  _ds_bundle.css fonts: ${rewrote} url(s) rewritten to fonts/${dropped ? `, ${dropped} dead @font-face block(s) dropped` : ''}`);
  }
}

export function writeStylesCss({ out, tokenFiles, bundleCss, fontRules, remoteImports }) {
  let hasBundleCss = false;
  try {
    const css = readFileSync(bundleCss ?? join(out, '_ds_bundle.css'), 'utf8');
    hasBundleCss = css.trim().length > 0 && !css.startsWith('/* @ds-css-runtime');
  } catch { /* absent */ }
  const styleImports = [
    ...tokenFiles.map((f) => `@import "./tokens/${f}";`),
    ...(fontRules.length ? ['@import "./fonts/fonts.css";'] : []),
    ...remoteImports.map((u) => `@import url("${u}");`),
    ...(hasBundleCss ? ['@import "./_ds_bundle.css";'] : []),
  ];
  if (styleImports.length) {
    writeFileSync(join(out, 'styles.css'), styleImports.join('\n') + '\n');
    console.error(`  styles.css: ${styleImports.length} @import(s)${hasBundleCss ? ' (incl. _ds_bundle.css \u2014 component styles ship to designs via this closure)' : ''}`);
    return;
  }
  writeFileSync(
    join(out, 'styles.css'),
    '/* @ds-styles: runtime \u2014 this design system injects its styles at runtime (CSS-in-JS); no static stylesheet to import. */\n',
  );
  console.error('[CSS_RUNTIME] no static CSS found (tokens/component/fonts/remote all empty) \u2014 wrote a self-styling styles.css. Expected for CSS-in-JS DSes; if this DS does ship a stylesheet, set cfg.cssEntry to it. If cfg.cssEntry is ALREADY set and renders verify, this line refers only to the scrape \u2014 do not chase it.');
}
