import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/smartc-browser.js',
      format: 'iife',
      name: 'SmaRTC',
      sourcemap: true,
      globals: {}
    }
  ],
  external: ['@microsoft/signalr', '@msgpack/msgpack'],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      clean: true
    })
  ]
};
