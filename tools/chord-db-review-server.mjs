#!/usr/bin/env node
/**
 * 校对工具的本地静态服务器
 *
 * 用法：
 *   node tools/chord-db-review-server.mjs
 *   然后浏览器打开 http://localhost:8765/
 *
 * 路由：
 *   GET  /                       → tools/chord-db-review.html
 *   GET  /renderer               → src/core/chord-diagram-renderer.js（提供给浏览器 import）
 *   GET  /chords/<name>.png      → public/chords/<name>.png
 *   GET  /list                   → 列出所有 PNG 与对应草稿/已校对状态
 *   GET  /raw/<name>.json        → scripts/chord-db-raw/<name>.json（草稿）
 *   GET  /reviewed/<name>.json   → src/core/chord-png-db/<name>.json（已校对）
 *   PUT  /reviewed/<name>.json   → 写入 src/core/chord-png-db/<name>.json
 */

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PNG_DIR = path.join(ROOT, 'public/chords');
const RAW_DIR = path.join(ROOT, 'scripts/chord-db-raw');
const REVIEWED_DIR = path.join(ROOT, 'src/core/chord-png-db');
const HTML_PATH = path.join(__dirname, 'chord-db-review.html');
const RENDERER_PATH = path.join(ROOT, 'src/core/chord-diagram-renderer.js');

const PORT = Number(process.env.PORT ?? 8765);

const SKIP_PNG = new Set(['quartal.png']);

await fs.mkdir(REVIEWED_DIR, { recursive: true });

function safeName(name) {
  return /^[\w.-]+$/.test(name) && !name.includes('..');
}

async function readJsonOrNull(filePath) {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function listEntries() {
  const pngs = (await fs.readdir(PNG_DIR))
    .filter(f => f.endsWith('.png'))
    .filter(f => !SKIP_PNG.has(f))
    .sort();
  const entries = await Promise.all(pngs.map(async png => {
    const stem = png.replace(/\.png$/, '');
    const rawPath = path.join(RAW_DIR, `${stem}.json`);
    const reviewedPath = path.join(REVIEWED_DIR, `${stem}.json`);
    const [rawExists, reviewedExists] = await Promise.all([
      fs.access(rawPath).then(() => true, () => false),
      fs.access(reviewedPath).then(() => true, () => false),
    ]);
    return { png, stem, rawExists, reviewedExists };
  }));
  return entries;
}

async function send(res, status, contentType, body) {
  res.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  res.end(body);
}

async function sendFile(res, filePath, contentType) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': contentType, 'cache-control': 'no-store' });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end(`Not found: ${filePath}\n${err.message}`);
  }
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method ?? 'GET';

  try {
    if (method === 'GET' && pathname === '/') {
      return sendFile(res, HTML_PATH, 'text/html; charset=utf-8');
    }
    if (method === 'GET' && pathname === '/renderer') {
      return sendFile(res, RENDERER_PATH, 'application/javascript; charset=utf-8');
    }
    if (method === 'GET' && pathname === '/list') {
      const entries = await listEntries();
      return send(res, 200, 'application/json', JSON.stringify(entries));
    }
    if (method === 'GET' && pathname.startsWith('/chords/')) {
      const name = pathname.slice('/chords/'.length);
      if (!safeName(name) || !name.endsWith('.png')) {
        return send(res, 400, 'text/plain', 'bad name');
      }
      return sendFile(res, path.join(PNG_DIR, name), 'image/png');
    }
    if (method === 'GET' && pathname.startsWith('/raw/')) {
      const name = pathname.slice('/raw/'.length);
      if (!safeName(name) || !name.endsWith('.json')) {
        return send(res, 400, 'text/plain', 'bad name');
      }
      const data = await readJsonOrNull(path.join(RAW_DIR, name));
      return send(res, data ? 200 : 404, 'application/json',
        JSON.stringify(data ?? { error: 'not_found' }));
    }
    if (method === 'GET' && pathname.startsWith('/reviewed/')) {
      const name = pathname.slice('/reviewed/'.length);
      if (!safeName(name) || !name.endsWith('.json')) {
        return send(res, 400, 'text/plain', 'bad name');
      }
      const data = await readJsonOrNull(path.join(REVIEWED_DIR, name));
      return send(res, data ? 200 : 404, 'application/json',
        JSON.stringify(data ?? { error: 'not_found' }));
    }
    if (method === 'PUT' && pathname.startsWith('/reviewed/')) {
      const name = pathname.slice('/reviewed/'.length);
      if (!safeName(name) || !name.endsWith('.json')) {
        return send(res, 400, 'text/plain', 'bad name');
      }
      const body = await readBody(req);
      try {
        JSON.parse(body); // 验证是合法 JSON
      } catch {
        return send(res, 400, 'application/json',
          JSON.stringify({ error: 'invalid_json' }));
      }
      await fs.writeFile(path.join(REVIEWED_DIR, name), body, 'utf8');
      return send(res, 200, 'application/json', JSON.stringify({ ok: true }));
    }

    send(res, 404, 'text/plain', 'not found');
  } catch (err) {
    send(res, 500, 'text/plain', String(err?.message ?? err));
  }
});

server.listen(PORT, () => {
  console.log(`[chord-db-review] http://localhost:${PORT}/`);
  console.log(`  raw     ← ${path.relative(ROOT, RAW_DIR)}`);
  console.log(`  reviewed→ ${path.relative(ROOT, REVIEWED_DIR)}`);
});
