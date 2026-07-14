import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const host = process.env.HOST ?? '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const staticRoot = resolve(projectRoot, process.env.STATIC_DIR ?? 'dist');
const indexPath = join(staticRoot, 'index.html');

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.wasm', 'application/wasm'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function isInsideStaticRoot(candidatePath) {
  const pathFromRoot = relative(staticRoot, candidatePath);
  return (
    pathFromRoot === '' || (!pathFromRoot.startsWith('..') && !pathFromRoot.includes(`..${sep}`))
  );
}

function resolveRequestPath(requestUrl) {
  const parsedUrl = new URL(requestUrl, 'http://localhost');
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const requestedPath = resolve(staticRoot, `.${pathname}`);

  if (!isInsideStaticRoot(requestedPath)) {
    return null;
  }

  return requestedPath;
}

function cacheControlFor(filePath) {
  const pathFromRoot = relative(staticRoot, filePath);

  if (pathFromRoot.startsWith(`assets${sep}`)) {
    return 'public, max-age=31536000, immutable';
  }

  if (filePath === indexPath) {
    return 'no-cache';
  }

  return 'public, max-age=3600';
}

function sendFile(response, filePath) {
  const extension = extname(filePath);
  const contentType = mimeTypes.get(extension) ?? 'application/octet-stream';

  response.writeHead(200, {
    'Cache-Control': cacheControlFor(filePath),
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  });

  createReadStream(filePath).pipe(response);
}

function sendNotFound(response) {
  response.writeHead(404, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end('Not found');
}

function sendBadRequest(response) {
  response.writeHead(400, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end('Bad request');
}

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT}`);
  process.exit(1);
}

if (!existsSync(indexPath)) {
  console.error(
    `Production build not found at ${indexPath}. Run "npm run build" before "npm start".`,
  );
  process.exit(1);
}

const server = createServer((request, response) => {
  if (!request.url || (request.method !== 'GET' && request.method !== 'HEAD')) {
    sendNotFound(response);
    return;
  }

  let requestedPath;

  try {
    requestedPath = resolveRequestPath(request.url);
  } catch {
    sendBadRequest(response);
    return;
  }

  if (!requestedPath) {
    sendBadRequest(response);
    return;
  }

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    sendFile(response, requestedPath);
    return;
  }

  if (!extname(requestedPath)) {
    sendFile(response, indexPath);
    return;
  }

  sendNotFound(response);
});

server.listen(port, host, () => {
  console.log(`Serving ${staticRoot} at http://${host}:${port}`);
});
