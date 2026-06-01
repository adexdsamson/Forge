'use client';

import deepEqual from '../utils';
import React from 'react';
import { Slot, isReactNative, isTextInput, isPicker, isSwitch, isSlider } from '../utils';
import { memo } from 'react';
import { FieldValues, useController, useFormContext } from 'react-hook-form';
import { ForgerControllerProps, ForgerProps } from '../types';

const ForgerController = <TFieldValues extends FieldValues = FieldValues>(
  props: ForgerControllerProps<TFieldValues>
) => {
  const { rules, transform, methods, component, name, handler, ...rest } = props;
  const {
    field: { onBlur, onChange, value, ref },
    fieldState: { error },
  } = useController<TFieldValues>({ name, rules, control: methods?.control });
  const Component = component;

  const getTextTransform = (text: unknown) => {
    return typeof transform === 'undefined' ? text : transform.output?.(text);
  };

  const getTransformedValue = (text: unknown) => {
    return typeof transform === 'undefined' ? text : transform.input?.(text);
  };

  // Platform-specific event handlers
  const getEventHandlers = () => {
    const handlers: any = {};

    if (handler) {
      handlers[handler] = (value: unknown) => onChange(getTextTransform(value));
      handlers.onChange = () => {};
    } else if (isReactNative) {
      // React Native components use different event handlers
      if (
        isTextInput(component) ||
        (component as React.ComponentType<unknown>)?.displayName === 'TextInput'
      ) {
        handlers.onChangeText = (value: unknown) => onChange(getTextTransform(value));
        handlers.onChange = () => {};
      } else if (isSwitch(component) || isPicker(component) || isSlider(component)) {
        // Switch/Slider/Picker pass boolean/number values — must not be typed string (WR-05)
        handlers.onValueChange = (value: unknown) => onChange(getTextTransform(value));
      } else {
        handlers.onChange = (value: unknown) => onChange(getTextTransform(value));
      }
    } else {
      // Web components use standard onChange
      handlers.onChange = (value: unknown) => onChange(getTextTransform(value));
    }

    return handlers;
  };

  const handleTrigger = getEventHandlers();

  return (
    <Component
      {...rest}
      ref={ref}
      name={name}
      onBlur={onBlur}
      error={error?.message}
      control={methods.control}
      value={getTransformedValue(value)}
      {...handleTrigger}
    />
  );
};

const MemorizeController = memo<ForgerControllerProps<FieldValues>>(
  (props) => <ForgerController {...props} />,
  (prev, next) => {
    const { methods, dependencies = [], ...others } = next;
    const { methods: _, dependencies: prevDependencies = [], ...rest } = prev;

    // Check if dependencies have changed
    if (dependencies.length > 0 && prevDependencies.length > 0) {
      const depsChanged = dependencies.some((dep, index) => dep !== prevDependencies[index]);
      if (depsChanged) {
        return false; // Re-render if dependencies changed
      }
    }

    // Check if form state has changed
    if (_.formState?.isDirty !== methods.formState?.isDirty) {
      return false; // Re-render if form state changed
    }

    // Check if other props have changed
    if (!deepEqual(rest, others)) {
      return false; // Re-render if other props changed
    }

    return true; // Don't re-render if nothing changed
  }
);

MemorizeController.displayName = 'MemorizeController';

/**
 * Connects a single form field to react-hook-form via `useController`, auto-wiring platform event handlers.
 *
 * @remarks
 * RN: pass native props (e.g. `keyboardType`, `secureTextEntry`) **directly** on `<Forger>`, not via
 * a `reactNative={{}}` prop — extra props are spread to the component via `...rest`. There is no
 * `reactNative` key; passing it would be silently ignored.
 *
 * Every `<Forger>` must have a `name` prop; nameless instances are not wired into the form
 * (`isInputSlot` checks `child.props.name`).
 *
 * `transform`: `output` transforms value **before writing to RHF** (display→stored);
 * `input` transforms value **before passing to the component** (stored→display).
 *
 * When rendered outside `<Forge>` (no FormProvider context), pass `control` explicitly.
 *
 * @param props - {@link ForgerProps} — `name` and `component` are required; extra props are spread to `component`.
 * @returns A memoised field controller wrapped in a `Slot`.
 *
 * @example
 * ```tsx
 * // Web
 * <Forger name="email" component={TextInput} rules={{ required: 'Required' }} />
 * // React Native — native props go directly on <Forger>
 * <Forger name="phone" component={TextInput} keyboardType="phone-pad" />
 * ```
 */
export const Forger = <T extends FieldValues>(props: ForgerProps<T>) => {
  // Fail-fast guard: Forger requires a single valid React element as its component.
  // Fires before Slot so the developer sees the Forger + field name in the error,
  // not the generic Slot message (D-08 / CORR-02).
  if (props.children != null && React.Children.count(props.children) > 1) {
    throw new Error(
      `Forger: field "${props.name}" expects exactly one valid React element as its child`
    );
  }
  if (
    props.children != null &&
    !React.isValidElement(props.children) &&
    React.Children.count(props.children) !== 0
  ) {
    throw new Error(
      `Forger: field "${props.name}" expects exactly one valid React element as its child`
    );
  }

  const methods = useFormContext() ?? { control: props?.control };

  return (
    <Slot>
      <MemorizeController
        {...props}
        name={props.name}
        methods={methods}
        component={props.component}
      />
    </Slot>
  );
};

Forger.displayName = 'Forger';
