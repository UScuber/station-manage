/// <reference types="vite/client" />

interface ImoprtMetaEnv {
  readonly VITE_API_BASEURL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
