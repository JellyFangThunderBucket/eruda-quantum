#!/usr/bin/env node
/* global process */
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const target = path.join(root, 'test', 'lib')
const files = [
  'node_modules/jasmine-core/lib/jasmine-core/jasmine.css',
  'node_modules/jasmine-core/lib/jasmine-core/jasmine.js',
  'node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js',
  'node_modules/jasmine-core/lib/jasmine-core/boot.js',
  'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
  'node_modules/jquery/dist/jquery.js',
]

fs.mkdirSync(target, { recursive: true })
for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(target, path.basename(file)))
}
