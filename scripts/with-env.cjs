require('./load-env.cjs')

const { spawn } = require('node:child_process')
const { constants } = require('node:os')

const [command, ...args] = process.argv.slice(2)
if (!command) throw new Error('Usage: node scripts/with-env.cjs <command> [args...]')

const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => child.kill(signal))
}
child.on('error', () => {
    console.error('Unable to start the workspace command. Check that dependencies are installed.')
    process.exitCode = 1
})
child.on('exit', (code, signal) => {
    process.exitCode = code ?? (signal ? 128 + constants.signals[signal] : 1)
})
