import path from 'path'
import { isDirExists, isFileExists, jsonStringify, log } from 'svag-cli-utils'
import { promises as fs } from 'fs'

export const createPackageJson = async (props: {
  dirPath: string
  public: boolean
  cli: boolean
  owner: string
  name: string
  authorName: string
  authorUrl: string
}) => {
  log.green('Creating package.json config file...')
  const packageJsonPath = path.resolve(props.dirPath, 'package.json')
  const { fileExists } = await isFileExists({ filePath: packageJsonPath })
  if (fileExists) {
    log.toMemory.black(`${packageJsonPath}: file already exists`)
    return
  }
  const { dirExists } = await isDirExists({ cwd: props.dirPath })
  if (!dirExists) {
    await fs.mkdir(props.dirPath, { recursive: true })
  }
  const packageJsonData = {
    name: props.name,
    version: '0.1.0',
    homepage: `https://github.com/${props.owner}/${props.name}`,
    repository: {
      type: 'git',
      url: `git+https://github.com/${props.owner}/${props.name}.git`,
    },
    bugs: {
      url: `https://github.com/${props.owner}/${props.name}/issues`,
    },
    author: {
      name: props.authorName,
      url: props.authorUrl,
    },
    ...(props.public
      ? {
          license: 'MIT',
          publishConfig: {
            access: 'public',
          },
        }
      : {
          private: true,
        }),
    type: 'module',
    files: [...(props.cli ? ['./bin/**/*'] : []), './dist/**/*'],
    ...(props.cli && {
      bin: {
        'svag-init': './bin/index.js',
      },
    }),
    scripts: {},
    dependencies: {},
    devDependencies: {},
  }
  const packageJsonString = jsonStringify({
    data: packageJsonData,
    order: [
      'name',
      'version',
      'homepage',
      'repository',
      'bugs',
      'author',
      'license',
      'publishConfig',
      'module',
      'bin',
      'files',
      'scripts',
      'dependencies',
      'devDependencies',
      'libalibe',
    ],
  })
  await fs.writeFile(packageJsonPath, packageJsonString)
  log.toMemory.black(`${packageJsonPath}: file created`)
}
