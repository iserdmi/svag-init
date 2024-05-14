import { promises as fs } from 'fs'
import path from 'path'
import { isFileExists, log, validateOrThrow } from 'svag-cli-utils'
import { fileURLToPath } from 'url'
import z from 'zod'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const createGitignore = async (props: { config?: string; dirPath: string }) => {
  log.green('Creating .gitignore config file...')
  const filePath = path.resolve(props.dirPath, '.gitignore')
  const { fileExists: configExists } = await isFileExists({ filePath: filePath })
  if (configExists) {
    log.toMemory.black(`${filePath}: file already exists`)
    return
  }
  const configName = validateOrThrow({
    zod: z.enum(['base']),
    text: 'Invalid config name',
    data: props.config,
  })
  const sourceFilePath = path.resolve(__dirname, `../../configs/gitignore/${configName}.gitignore`)
  const { fileExists: sourceFileExists } = await isFileExists({ filePath: sourceFilePath })
  if (!sourceFileExists) {
    throw new Error(`Source file not found: ${sourceFilePath}`)
  }
  const content = await fs.readFile(sourceFilePath, 'utf-8')
  await fs.writeFile(filePath, content)
  log.toMemory.black(`${filePath}: file created`)
}
