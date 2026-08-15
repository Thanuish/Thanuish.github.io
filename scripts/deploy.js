/**
 * Build and publish the site to the gh-pages branch.
 *
 * The CI build currently fails on GitHub's runner, so the site is served from
 * a branch holding a prebuilt copy. This script does that end to end.
 *
 * It never checks the branch out. Instead it stages `dist` into a throwaway
 * index, writes a tree, and commits that tree directly with plumbing. Nothing
 * touches the working tree, the real index, or the branch you are on, and
 * there is no worktree to leave behind if something fails partway.
 *
 * Usage: npm run deploy          (pushes to the "site" remote)
 *        npm run deploy origin   (or any other remote)
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const indexFile = join(root, '.git', 'deploy-index')
const BRANCH = 'gh-pages'
const REMOTE = process.argv[2] ?? 'site'

// The staging index lives outside the normal one so the working tree and the
// branch currently checked out are untouched throughout.
const gitEnv = { ...process.env, GIT_INDEX_FILE: indexFile }

const run = (args, options = {}) =>
    execFileSync('git', args, { stdio: 'inherit', cwd: root, ...options })

const capture = (args, options = {}) =>
    execFileSync('git', args, { encoding: 'utf8', cwd: root, ...options }).trim()

/** Every file under `directory`, recursively. */
function walk(directory)
{
    const found = []

    for(const entry of readdirSync(directory))
    {
        const path = join(directory, entry)

        if(statSync(path).isDirectory())
            found.push(...walk(path))
        else
            found.push(path)
    }

    return found
}

console.log('\n> building (compressed)')
execFileSync('npm', [ 'run', 'build' ], {
    stdio: 'inherit',
    cwd: root,
    shell: true,
    env: { ...process.env, VITE_COMPRESSED: '1' }
})

if(!existsSync(join(dist, 'index.html')))
{
    console.error('\n! build produced no index.html, aborting\n')
    process.exit(1)
}

console.log('\n> pruning assets the compressed build never loads')
let removed = 0

for(const file of walk(dist))
{
    const isWav = file.endsWith('.wav')
    const supersededTexture = file.endsWith('.png') && existsSync(file.replace(/\.png$/, '.ktx'))
    const supersededModel = file.endsWith('.glb')
        && !file.endsWith('-compressed.glb')
        && existsSync(file.replace(/\.glb$/, '-compressed.glb'))

    if(isWav || supersededTexture || supersededModel)
    {
        rmSync(file)
        removed++
    }
}

console.log(`  removed ${removed} files`)

// Stops GitHub Pages running the output through Jekyll, which would drop any
// file or folder beginning with an underscore.
writeFileSync(join(dist, '.nojekyll'), '')

console.log(`\n> publishing to ${REMOTE}/${BRANCH}`)
rmSync(indexFile, { force: true })

try
{
    // dist is gitignored for normal work, so staging it needs --force.
    run([ '--work-tree', dist, 'add', '--force', '-A' ], { env: gitEnv })

    const tree = capture([ 'write-tree' ], { env: gitEnv })
    const message = `Deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`
    const commit = capture([ 'commit-tree', tree, '-m', message ], { env: gitEnv })

    run([ 'push', '--force', REMOTE, `${commit}:refs/heads/${BRANCH}` ])

    const fileCount = capture([ 'ls-tree', '-r', '--name-only', commit ]).split('\n').length

    console.log(`\n> done. ${commit.slice(0, 7)} (${fileCount} files) pushed to ${REMOTE}/${BRANCH}`)
    console.log('  live in about a minute; hard refresh with Ctrl+Shift+R\n')
}
finally
{
    rmSync(indexFile, { force: true })
}
