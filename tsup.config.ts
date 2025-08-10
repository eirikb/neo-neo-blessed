import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  entry: {
    blessed: 'lib/blessed.ts',
  },
  format: ['cjs', 'esm'],
  target: 'es2022',
  dts: {
    compilerOptions: {
      strict: false,
      noImplicitAny: false,
      noImplicitThis: false,
      skipLibCheck: true,
      allowJs: true,
      checkJs: false,
    },
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  treeshake: false,
  minify: options.minify ?? process.env.NODE_ENV === 'production',
  outDir: 'dist',
  skipNodeModulesBundle: true,
  platform: 'node',
  external: ['./dist/blessed.js', './dist/blessed'],
  // ESM compatibility for legacy CommonJS codebase
  esbuildOptions(options, context) {
    if (context.format === 'esm') {
      // Inject CommonJS globals for Node.js ESM compatibility
      options.banner = {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url); const module = { exports: {} };',
      };
    }
  },
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
}));
