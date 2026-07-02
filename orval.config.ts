import { defineConfig } from 'orval'

// Generates a typed TanStack Query client from the backend contract.
// Input is the vendored openapi.yaml (locally); switch to the published/pinned spec
// URL when going online (00-MAIN-PRD §7). Regenerate with: npm run gen:api
export default defineConfig({
  ski: {
    input: {
      target: './openapi.yaml',
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/api/fetcher.ts',
          name: 'customFetch',
        },
      },
    },
  },
})
