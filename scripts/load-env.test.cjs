const assert = require('node:assert/strict')
const { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join } = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')

function runFixture(t, contents, externalValue) {
    const root = mkdtempSync(join(tmpdir(), 'aiflow-env-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    mkdirSync(join(root, 'scripts'))
    mkdirSync(join(root, 'apps/workflow'), { recursive: true })
    copyFileSync(join(__dirname, 'load-env.cjs'), join(root, 'scripts/load-env.cjs'))
    if (contents !== null) writeFileSync(join(root, '.env'), contents)
    writeFileSync(join(root, 'apps/workflow/.env'), 'SHARED_ENV_TEST=from-child\n')
    const env = { ...process.env }
    delete env.SHARED_ENV_TEST
    if (externalValue !== undefined) env.SHARED_ENV_TEST = externalValue
    return spawnSync(
        process.execPath,
        ['--require', join(root, 'scripts/load-env.cjs'), '-e', 'process.stdout.write(process.env.SHARED_ENV_TEST ?? "missing")'],
        {
            cwd: join(root, 'apps/workflow'),
            env,
            encoding: 'utf8',
        }
    )
}

test('loads the root env regardless of the child working directory', t => {
    const result = runFixture(t, 'SHARED_ENV_TEST=from-root\n')
    assert.equal(result.status, 0)
    assert.equal(result.stdout, 'from-root')
})

test('keeps externally supplied environment variables', t => {
    const result = runFixture(t, 'SHARED_ENV_TEST=from-root\n', 'from-deployment')
    assert.equal(result.status, 0)
    assert.equal(result.stdout, 'from-deployment')
})

test('supports deployment without a local env file and ignores child env files', t => {
    const result = runFixture(t, null)
    assert.equal(result.status, 0)
    assert.equal(result.stdout, 'missing')
})
