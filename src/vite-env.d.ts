/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_PHOTO_BUCKET?: string
  readonly VITE_EVENT_NAME?: string
  readonly VITE_EVENT_START?: string
  readonly VITE_EVENT_END?: string
  readonly VITE_EVENT_DATE_LABEL?: string
  readonly VITE_EVENT_TIME_LABEL?: string
  readonly VITE_EVENT_HOST?: string
  readonly VITE_EVENT_CONTACT?: string
  readonly VITE_EVENT_VENUE?: string
  readonly VITE_EVENT_ADDRESS?: string
  readonly VITE_EVENT_HALL?: string
  readonly VITE_EVENT_MAPS_URL?: string
  readonly VITE_QUALITY?: 'auto' | 'high' | 'low'
  readonly VITE_MAX_DPR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
