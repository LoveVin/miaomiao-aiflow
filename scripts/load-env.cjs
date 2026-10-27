const { existsSync } = require('node:fs')
const { resolve } = require('node:path')

// Resolve from this file so every workspace uses the same configuration.
const envPath = resolve(__dirname, '../.env')
if (existsSync(envPath)) process.loadEnvFile(envPath)
