import { defineConfig } from 'tsup';

export default defineConfig(options => ({
  entry: {
    blessed: 'lib/blessed.ts',
  },
  format: ['cjs', 'esm'],
  target: 'node18',
  dts: {
    compilerOptions: {
      strict: false,
      noImplicitAny: false,
      noImplicitThis: false,
      skipLibCheck: true,
      allowJs: true,
      checkJs: false,
      module: 'ESNext',
      moduleResolution: 'Node',
    },
  },
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  treeshake: true,
  minify: options.minify ?? process.env.NODE_ENV === 'production',
  outDir: 'dist',
  skipNodeModulesBundle: true,
  platform: 'node',
  onSuccess: async () => {
    console.log('Build completed successfully!');
  },
}));
