/* eslint-disable no-console */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

interface PackageJson {
  name: string
  version: string
  peerDependencies?: Record<string, string>
}

const projectRoot = process.cwd()

function updatePeerDependencies() {
  console.log('Starting peer dependency update...')

  // Get the current @channel-state/core version
  const corePackageJsonPath = join(projectRoot, 'packages/core/package.json')
  const corePackageJson: PackageJson = JSON.parse(
    readFileSync(corePackageJsonPath, 'utf8'),
  ) as PackageJson
  const coreVersion = corePackageJson.version

  console.log(`@channel-state/core version: ${coreVersion}`)

  const packageJsonPaths = [
    join(projectRoot, 'packages/react/package.json'),
    join(projectRoot, 'packages/svelte/package.json'),
    join(projectRoot, 'packages/vue/package.json'),
  ]

  packageJsonPaths.forEach((packageJsonPath) => {
    try {
      const packageJson: PackageJson = JSON.parse(
        readFileSync(packageJsonPath, 'utf8'),
      ) as PackageJson
      let changed = false

      if (packageJson.peerDependencies?.['@channel-state/core']) {
        if (
          packageJson.peerDependencies['@channel-state/core'] !==
          `^${coreVersion}`
        ) {
          packageJson.peerDependencies['@channel-state/core'] =
            `^${coreVersion}`
          changed = true
          console.log(
            `Updated ${packageJson.name}'s @channel-state/core peer dependency to ^${coreVersion}`,
          )
        } else {
          console.log(
            `${packageJson.name}'s @channel-state/core peer dependency is already up-to-date.`,
          )
        }
      }

      if (changed) {
        writeFileSync(
          packageJsonPath,
          JSON.stringify(packageJson, null, 2) + '\n',
        )
      }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`Skipping non-existent package.json: ${packageJsonPath}`)
      } else {
        console.error(
          `Error processing ${packageJsonPath}:`,
          (error as Error).message,
        )
      }
    }
  })

  console.log('Peer dependency update complete.')
}

updatePeerDependencies()
