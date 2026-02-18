/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_ADMIN_USER_IDS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
