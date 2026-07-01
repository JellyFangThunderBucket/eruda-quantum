#!/usr/bin/env node
/* global process */
const fs = require('fs')
const path = require('path')

fs.rmSync(path.resolve(process.cwd(), 'dist'), { recursive: true, force: true })
