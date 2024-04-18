import { createGitignore } from '@/lib/createGitignore'
import { createPackageJson } from '@/lib/createPackageJson'
import path from 'path'
import {
  createDir,
  createFile,
  defineCliApp,
  exec,
  getFirstStringValue,
  getPackageJsonPath,
  getPathInfo,
  log,
  spawn,
} from 'svag-cli-utils'

defineCliApp(async ({ cwd, command, args, argr, flags }) => {
  const requestedPath = path.resolve(cwd, args[0] || '.')
  const argrExceptPath = argr[0]?.startsWith('-') ? argr : argr.slice(1)
  const { packageJsonPath } = await getPackageJsonPath({ cwd: __dirname })
  const dirPathHere = path.dirname(packageJsonPath)
  const spwn = async (command: string) => {
    await spawn({ cwd: dirPathHere, exitOnFailure: true, command })
  }

  const throwIfDirNotEmpty = async () => {
    const pathInfo = await getPathInfo({ cwd: requestedPath })
    if (!pathInfo.pathExists) {
      return
    }
    if (pathInfo.itIsFile) {
      throw new Error(`Path is a file: ${requestedPath}`)
    }
    if (!pathInfo.dirEmpty) {
      throw new Error(`Directory is not empty: ${requestedPath}`)
    }
  }

  switch (command) {
    case 'package-json':
    case 'pkg': {
      const getGitConfigValue = async (key: string) => {
        const value = await exec({ cwd: requestedPath, command: `git config --get ${key}` })
        return value.trim()
      }
      const dirLastname = path.basename(requestedPath)
      await createPackageJson({
        dirPath: requestedPath,
        public: !!flags.public || !!flags.p || false,
        cli: !!flags.cli || !!flags.c,
        owner: getFirstStringValue(flags.owner, flags.o, await getGitConfigValue('user.owner')) || '%YOUR_TEAM%',
        name: getFirstStringValue(flags.name, flags.n, dirLastname) || '%YOUR_PROJECT%',
        authorName:
          getFirstStringValue(flags.authorName, flags.a, await getGitConfigValue('user.name')) || '%YOUR_NAME%',
        authorUrl: getFirstStringValue(flags.authorUrl, flags.u, await getGitConfigValue('user.url')) || '%YOUR_URL%',
      })
      break
    }
    case 'gitignore':
    case 'gi': {
      await createGitignore({ dirPath: requestedPath, config: getFirstStringValue(flags.config, flags.c) || 'base' })
      break
    }
    case 'lint':
    case 'l':
      await spwn(`pnpm svag-lint init ${requestedPath} ${argrExceptPath.join(' ')}`)
      break
    case 'tsconfig':
    case 'ts':
      await spwn(`pnpm svag-ts init ${requestedPath} ${argrExceptPath.join(' ')}`)
      break
    case 'prettier':
    case 'p':
      await spwn(`pnpm svag-prettier init ${requestedPath} ${argrExceptPath.join(' ')}`)
      break
    case 'jest':
    case 'j':
      await spwn(`pnpm svag-jest init ${requestedPath} ${argrExceptPath.join(' ')}`)
      break
    case 'husky':
    case 'hu':
      await spwn(`pnpm svag-husky init ${requestedPath} ${argrExceptPath.join(' ')}`)
      break
    case 'h': {
      log.black(`Commands:
      ts-lib — public ts library

      package-json | pkg
      gitignore | gi
      lint | l
      tsconfig | ts
      prettier | p
      jest | j
      husky | hu

      h — help
      `)
      break
    }
    case 'ping': {
      await spwn('echo pong')
      break
    }

    // General

    case 'ts-lib': {
      await throwIfDirNotEmpty()
      await createDir({ cwd: requestedPath })
      await spwn(`pnpm svag-init pkg '${requestedPath}' --public`)
      await spwn(`pnpm svag-init gi '${requestedPath}'`)
      await spwn(`pnpm svag-init p '${requestedPath}'`)
      await spwn(`pnpm svag-init ts '${requestedPath}'`)
      await spwn(`pnpm svag-init l '${requestedPath}'`)
      await spwn(`pnpm svag-init j '${requestedPath}'`)
      await spwn(`pnpm svag-init hu '${requestedPath}'`)
      await createFile({ cwd: path.resolve(requestedPath, 'src/index.ts') })
      log.toMemory.black(`Done: ${requestedPath}`)
      break
    }

    default: {
      log.red('Unknown command:', command)
      break
    }
  }
})
