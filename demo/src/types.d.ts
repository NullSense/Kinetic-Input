declare module '@tensil/kinetic-input' {
  export const CollapsibleNumberPicker: any;
  export const StandaloneWheelPicker: any;
  export const PickerGroup: any;
  export const PickerColumn: any;
  export const PickerItem: any;
}

// Extend Window interface for debug flags
interface Window {
  __QNI_DEBUG__?: boolean;
  __QNI_SNAP_DEBUG__?: boolean;
  __QNI_STATE_DEBUG__?: boolean;
  __QNI_WHEEL_DEBUG__?: boolean;
  __QNI_ANIMATION_DEBUG__?: boolean;
}

// Extend ImportMeta for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_ENABLE_DEBUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
