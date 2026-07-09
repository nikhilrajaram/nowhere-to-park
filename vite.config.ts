import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const LOCAL_PMTILES_ROUTE = '/parking.pmtiles';

/**
 * Dev-only middleware serving a local PMTiles archive at /parking.pmtiles
 */
function localPMTiles(): Plugin {
  return {
    name: 'local-pmtiles',
    apply: 'serve',
    configureServer(server) {
      const filePath = process.env.PMTILES_LOCAL_FILE;
      if (!filePath) {
        return;
      }

      const resolved = path.resolve(server.config.root, filePath);
      if (!fs.existsSync(resolved)) {
        throw new Error(`PMTILES_LOCAL_FILE not found: ${resolved}`);
      }
      server.config.logger.info(`local-pmtiles: serving ${resolved} at ${LOCAL_PMTILES_ROUTE}`);

      server.middlewares.use(LOCAL_PMTILES_ROUTE, (req, res) => {
        const { size } = fs.statSync(resolved);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', 'application/octet-stream');

        const range = req.headers.range;
        if (!range) {
          res.setHeader('Content-Length', size);
          fs.createReadStream(resolved).pipe(res);
          return;
        }

        const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        const start = match ? Number(match[1]) : NaN;
        const end = match && match[2] !== '' ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (!match || start >= size || end < start) {
          res.statusCode = 416;
          res.setHeader('Content-Range', `bytes */${size}`);
          res.end();
          return;
        }

        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
        res.setHeader('Content-Length', end - start + 1);
        fs.createReadStream(resolved, { start, end }).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localPMTiles()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
