interface ImportMetaEnv {
  /** Canonical public URL of the deployed site. Used for the QR code. */
  readonly VITE_PUBLIC_APP_URL?: string
  /** Optional: public address of the Assassin game, used for its door QR code (e.g. https://assassin.example.com). */
  readonly VITE_ASSASSIN_URL?: string
  /** Optional: full URL of the GraphQL API. Defaults to the same-origin `/graphql`. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
