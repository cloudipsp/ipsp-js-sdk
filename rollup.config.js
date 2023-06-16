import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json';
import pkg from './package.json'

export default {
    input: pkg.main,
    output: [
        {
            file: 'dist/checkout.js',
            format: 'umd',
            name: '$checkout'
        },
        {
            file: 'dist/checkout.min.js',
            format: 'umd',
            sourcemap: true,
            name: '$checkout',
            plugins:[
                terser()
            ]
        },
    ],
    plugins: [
        commonjs(),
        resolve({}),
        json(),
        babel({
            presets: ['@babel/preset-env'],
            babelHelpers: 'bundled'
        })
    ]
}