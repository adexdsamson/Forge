import React from 'react';

/** A function that takes no arguments and returns nothing. */
export type Noop = () => void;

/** An observer that receives values of type `T` from a `Subject`. */
export type Observer<T> = {
  next: (value: T) => void;
};

/** A subscription handle returned by `Subject.subscribe`; call `unsubscribe` to clean up. */
export type Subscription = {
  unsubscribe: Noop;
};

/**
 * A minimal RxJS-style subject used internally by react-hook-form for reactive state broadcast.
 * Expose via `control._subjects.*` only when public RHF hooks are insufficient.
 */
export type Subject<T> = {
  readonly observers: Observer<T>[];
  subscribe: (value: Observer<T>) => Subscription;
  unsubscribe: Noop;
} & Observer<T>;

type Props<T> = {
  disabled?: boolean;
  subject: Subject<T>;
  next: (value: T) => void;
};

/**
 * Generic `Subject<T>` observer that subscribes on mount and cleans up on unmount or when `disabled` changes.
 *
 * @remarks
 * Generic Subject<T> observer. Pass a `subject` from RHF internals
 * (e.g. `control._subjects.values`) only when public RHF hooks (`useWatch`, `useFormState`) are
 * insufficient — prefer public APIs for stability across RHF minor updates.
 *
 * Set `disabled={true}` to skip subscribing (e.g. when the consumer is not yet ready).
 *
 * @param props - `{ subject, next, disabled? }` — the subject to observe, the callback, and an optional disable flag.
 * @returns void — side-effect only hook.
 *
 * @example
 * ```tsx
 * useSubscribe({
 *   subject: control._subjects.values,
 *   next: (formValues) => console.log(formValues),
 * });
 * ```
 */
export function useSubscribe<T>(props: Props<T>) {
  const _props = React.useRef(props);
  _props.current = props;

  React.useEffect(() => {
    const subscription =
      !props.disabled &&
      _props.current.subject &&
      _props.current.subject.subscribe({
        next: _props.current.next,
      });

    return () => {
      if (subscription) {
        subscription?.unsubscribe?.();
      }
    };
  }, [props.disabled]);
}
