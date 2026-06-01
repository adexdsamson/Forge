/**
 * React Native specific utilities and helpers for the Forge library.
 * Provides platform-aware event handler routing, value property mapping,
 * and error propagation for React Native form components.
 */

import { isReactNative, isWeb } from './utils';

/**
 * Map of known React Native component display names used for event-handler and value-prop routing.
 * Used by `getEventHandlerName` and `getValuePropertyName` to select the correct prop for each component type.
 */
export const REACT_NATIVE_COMPONENTS = {
  TextInput: 'TextInput',
  Switch: 'Switch',
  Picker: 'Picker',
  Slider: 'Slider',
  CheckBox: 'CheckBox',
  RadioButton: 'RadioButton',
} as const;

/**
 * Returns the correct event handler prop name for a given React Native component type.
 *
 * @remarks
 * Returns `'onChangeText'` for TextInput, `'onValueChange'` for Switch/Picker/Slider/CheckBox/RadioButton,
 * and `'onChange'` for all other types (or when not running on React Native).
 *
 * @param componentType - A component display name string (e.g. `'TextInput'`, `'Switch'`).
 * @returns The event handler prop name to use when wiring the field.
 */
export const getEventHandlerName = (componentType: string): string => {
  if (!isReactNative) return 'onChange';

  switch (componentType) {
    case REACT_NATIVE_COMPONENTS.TextInput:
      return 'onChangeText';
    case REACT_NATIVE_COMPONENTS.Switch:
    case REACT_NATIVE_COMPONENTS.Picker:
    case REACT_NATIVE_COMPONENTS.Slider:
      return 'onValueChange';
    case REACT_NATIVE_COMPONENTS.CheckBox:
    case REACT_NATIVE_COMPONENTS.RadioButton:
      return 'onValueChange';
    default:
      return 'onChange';
  }
};

/**
 * Returns the correct value prop name for a given React Native component type.
 *
 * @remarks
 * Returns `'selectedValue'` for Picker/Slider, `'value'` for all other types.
 *
 * @param componentType - A component display name string.
 * @returns The value prop name to use (e.g. `'value'` or `'selectedValue'`).
 */
export const getValuePropertyName = (componentType: string): string => {
  if (!isReactNative) return 'value';

  switch (componentType) {
    case REACT_NATIVE_COMPONENTS.TextInput:
      return 'value';
    case REACT_NATIVE_COMPONENTS.Switch:
    case REACT_NATIVE_COMPONENTS.CheckBox:
    case REACT_NATIVE_COMPONENTS.RadioButton:
      return 'value';
    case REACT_NATIVE_COMPONENTS.Picker:
    case REACT_NATIVE_COMPONENTS.Slider:
      return 'selectedValue';
    default:
      return 'value';
  }
};

/**
 * Sets an error message on a React Native input ref via `setNativeProps`.
 *
 * @remarks
 * No-ops when not running on React Native or when `ref.setNativeProps` is unavailable.
 * Clears the error when `error` is `undefined` or an empty string.
 *
 * @param ref - The React Native input ref (must expose `setNativeProps`).
 * @param error - The error message to set, or `undefined` to clear.
 */
export const setReactNativeError = (ref: any, error?: string) => {
  if (!isReactNative || !ref?.setNativeProps) return;

  ref.setNativeProps({
    error: error || undefined,
    style: error ? { borderColor: 'red' } : undefined,
  });
};

/**
 * Resolves the display name / type string for a React or React Native component or element.
 *
 * @param component - A React component, element, or any value.
 * @returns A string type name (e.g. `'TextInput'`, `'div'`, or `'unknown'`).
 */
export const getComponentType = (component: any): string => {
  if (!component) return 'unknown';

  // Check displayName first (common in React Native)
  if (component.displayName) {
    return component.displayName;
  }

  // Check type property
  if (component.type) {
    return typeof component.type === 'string'
      ? component.type
      : component.type.displayName || 'unknown';
  }

  // For web components, check tagName
  if (isWeb && component.tagName) {
    return component.tagName.toLowerCase();
  }

  return 'unknown';
};

/**
 * Merges base props with platform-specific props (`web` or `reactNative`), selecting the
 * correct branch at runtime based on the detected platform.
 *
 * @param baseProps - Props shared across all platforms.
 * @param platformProps - Optional object with `web` and/or `reactNative` branch props.
 * @returns Merged props object with the platform-specific branch applied on top.
 */
export const mergePlatformProps = (
  baseProps: any,
  platformProps?: { web?: any; reactNative?: any }
) => {
  if (!platformProps) return baseProps;

  const platformSpecificProps = isReactNative ? platformProps.reactNative : platformProps.web;

  return {
    ...baseProps,
    ...platformSpecificProps,
  };
};

/**
 * Validation rule helpers for React Native inputs (textInput, numeric, required).
 * These are utility predicates — Forge's main validation path goes through `validateField`.
 */
export const REACT_NATIVE_VALIDATION_RULES = {
  textInput: {
    maxLength: (value: string, max: number) => value.length <= max,
    minLength: (value: string, min: number) => value.length >= min,
    pattern: (value: string, pattern: RegExp) => pattern.test(value),
  },
  numeric: {
    max: (value: number, max: number) => value <= max,
    min: (value: number, min: number) => value >= min,
  },
  required: (value: any) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.length > 0;
    return value != null;
  },
};

/**
 * Normalises a React Native image/document picker result into a consistent file-like object
 * `{ uri, type, name, size }`. No-ops on web (returns the file as-is).
 *
 * @param file - A file object from an RN image picker, document picker, or any source.
 * @returns A normalised file descriptor on React Native; the original value on web.
 */
export const handleReactNativeFile = (file: any) => {
  if (!isReactNative) return file;

  // Handle React Native image picker result
  if (file && typeof file === 'object' && file.uri) {
    return {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || file.name || 'image.jpg',
      size: file.fileSize || file.size,
    };
  }

  return file;
};

/**
 * Returns the current platform as a string: `'react-native'`, `'web'`, or `'unknown'`.
 * Evaluated once at module load time; cannot change at runtime.
 */
export const getPlatform = () => {
  if (isReactNative) return 'react-native';
  if (isWeb) return 'web';
  return 'unknown';
};

/**
 * Returns `true` when running on React Native **and** the component's display name is a known
 * RN component type listed in `REACT_NATIVE_COMPONENTS`.
 *
 * @param component - A React component or element to test.
 * @returns `true` if the component is a recognised React Native component on the RN platform.
 */
export const isValidReactNativeComponent = (component: any): boolean => {
  if (!isReactNative || !component) return false;

  const componentType = getComponentType(component);
  return Object.values(REACT_NATIVE_COMPONENTS).includes(componentType as any);
};
