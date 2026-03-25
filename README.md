# Alphabetical Numbers

React + Vite app that plots numbers by Swedish alphabetical order.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## GitHub Pages

This project includes a GitHub Actions workflow at
`.github/workflows/deploy.yml` that deploys the built `dist` folder to GitHub
Pages whenever code is pushed to the `main` branch.

Notes:

- For project pages such as `https://github.com/<user>/<repo>`, Vite
  automatically uses `/<repo>/` as the base path during GitHub Actions builds.
- For user or organization pages such as `<user>.github.io`, Vite automatically
  uses `/` as the base path.

To publish:

1. Create or connect this folder to a GitHub repository.
2. Push the project to the `main` branch.
3. In the repository settings, set GitHub Pages to use GitHub Actions.
4. Let the workflow deploy the site.
