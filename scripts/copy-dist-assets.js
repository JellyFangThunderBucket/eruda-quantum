#!/usr/bin/env node
/* global process */
const fs = require('fs')
const path = require('path')

const root = process.cwd()
const dist = path.join(root, 'dist')

fs.mkdirSync(dist, { recursive: true })
for (const file of ['README.md', 'eruda.d.ts']) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file))
}
