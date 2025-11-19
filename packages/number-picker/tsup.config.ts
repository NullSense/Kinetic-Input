import { defineConfig } from 'tsup';
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'picker/index': 'src/picker/index.ts',
    'quick/index': 'src/quick/index.ts',
    'wheel/index': 'src/wheel/index.ts',
    'config/index': 'src/config/index.ts',
    'types/index': 'src/types/index.ts'
  },
  dts: {
    compilerOptions: {
      composite: false,
      customConditions: []
    }
  },
  tsconfig: 'tsconfig.dts.json',
  format: ['esm'],
  treeshake: true,
  sourcemap: true,
  clean: true,
  publicDir: 'src/styles'   // -> dist/styles/*
});
