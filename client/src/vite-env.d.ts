/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Map demo children to real `students.id` in Postgres (e.g. seed uses 5,6). */
  readonly VITE_PARENT_API_STUDENT_ID_1?: string;
  readonly VITE_PARENT_API_STUDENT_ID_2?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
