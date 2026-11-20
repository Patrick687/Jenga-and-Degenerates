interface ImportMetaEnv {
  /** Canonical public URL of the deployed site. Used for the QR code. */
  readonly VITE_PUBLIC_APP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
