import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import postcss from 'rollup-plugin-postcss';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// External dependencies that should not be bundled
const external = [
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.dependencies || {}),
  'react/jsx-runtime',
];

export default [
  // ES Modules build
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.mjs',
      format: 'es',
      sourcemap: true,
      banner: '"use client";',
    },
    plugins: [
      resolve({
        browser: true,
        exportConditions: ['import'],
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
      postcss({
        extract: 'styles.css',
        minimize: true,
      }),
    ],
    external,
  },
  // CommonJS build  
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      banner: '"use client";',
    },
    plugins: [
      resolve({
        browser: true,
        exportConditions: ['require'],
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.*', '**/*.spec.*'],
      }),
    ],
    external,
  },
  // Type definitions
  {
    input: 'src/index.tsx',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
    external,
  },
];