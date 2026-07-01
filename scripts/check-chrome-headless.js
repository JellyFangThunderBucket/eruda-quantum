#!/usr/bin/env node
/* global process */
const fs = require('fs')
const { spawnSync } = require('child_process')

const chromeBin = process.env.CHROME_BIN

function isExecutableCommand(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
  return !result.error && result.status === 0
}

function hasChromeBinary() {
  if (chromeBin) {
    return fs.existsSync(chromeBin) || isExecutableCommand(chromeBin)
  }

  const commands = [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ]
  if (commands.some(isExecutableCommand)) return true

  return [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].some(fs.existsSync)
}

if (!hasChromeBinary()) {
  console.error(
    [
      '',
      "ChromeHeadless is required to run Eruda's Karma test suite, but no Chrome or Chromium binary was found.",
      '',
      'Install Google Chrome or Chromium, or set CHROME_BIN to the browser executable before running tests.',
      '',
      'Examples:',
      '  macOS:   export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"',
      '  Linux:   export CHROME_BIN=/usr/bin/google-chrome',
      '  Windows: set CHROME_BIN=C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      '',
    ].join('\n')
  )
  process.exit(1)
}
