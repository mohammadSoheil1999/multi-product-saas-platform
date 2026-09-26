declare module '*.css';
interface ImportMetaEnv{readonly VITE_APP_MODE?:string;readonly VITE_API_URL?:string}
interface ImportMeta{readonly env:ImportMetaEnv}
