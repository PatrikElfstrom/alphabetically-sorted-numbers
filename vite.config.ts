import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? ''
const isUserOrOrgPagesSite = repositoryName.endsWith('.github.io')
const githubPagesBase =
  process.env.GITHUB_ACTIONS && repositoryName
    ? isUserOrOrgPagesSite
      ? '/'
      : `/${repositoryName}/`
    : '/'

// https://vite.dev/config/
export default defineConfig({
  base: githubPagesBase,
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
