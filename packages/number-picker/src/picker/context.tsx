import { createContext, useContext } from 'react';

export type PickerColumnConfig = {
  key: string;
  isPickerOpen: boolean;
};

const PickerColumnConfigContext = createContext<PickerColumnConfig | null>(null);

export const PickerConfigProvider = PickerColumnConfigContext.Provider;

export function usePickerConfig(componentName: string) {
  const context = useContext(PickerColumnConfigContext);
  if (context === null) {
    const error = new Error(
      `<${componentName} /> is missing a parent <Picker.Column /> component.`
    );
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, usePickerConfig);
    }
    throw error;
  }
  return context;
}
