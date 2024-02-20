
# Forge

Forge is a lightweight and user-friendly React form library designed to streamline the form-building process with simplicity and clarity in mind. Built on top of the robust react-hook-form library, Forge takes the hassle out of form management, offering an intuitive and clean setup that accelerates your development workflow.


## Badges

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)


## Authors

- [@adexdsamson](https://github.com/adexdsamson)
## Features

- Built with performance, UX in mind
- Support Yup, Zod, AJV, Superstruct, Joi and others
- Support react native
- Built on a robust library (react-hook-form)


## Installation

You can install `Forge` via npm or yarn:

```bash
  npm install @adexdsamson/forge react-hook-form
```
or 

```bash
  yarn add @adexdsamson/forge react-hook-form
```
## Quickstart

### Web setup

```js
import React from 'react';
import { useForge } from '@adexdsamson/forge';
import { Input, CustomButton } from 'your-components-library'; // Import your custom components

const Example = () => {
  const { ForgeForm, formState } = useForge();

  const signIn = async (data) => {
    // Handle sign-in logic
  }

  return (
    <ForgeForm onSubmit={signIn}>
      <input name='firstName' />
      <input name='lastName' />

      {errors.lastName && <p>Last name is required.</p>}

      <button
        type="submit"
      >
        Sign in
      </button>
    </ForgeForm>
  );
};
```
or

```js
import React from 'react';
import { useForge } from '@adexdsamson/forge';

const inputProps = [
   {
      name: "fullName",
      label: "Full Name",
      component: "input",
    },
    {
      name: "email",
      label: "Email",
      component: "input",
    },
]

const Example = () => {
  const { ForgeForm, formState } = useForge({
    fieldProps: inputProps,
  });

  const signIn = async (data) => {
    // Handle sign-in logic
  }

  return (
    <ForgeForm onSubmit={signIn}>
      <button
        type="submit"
      >
        Sign in
      </button>
    </ForgeForm>
  );
};

```

### Native setup

> **_NOTE:_**  The Forger componentis required for react native.

```js
import React from 'react';
import { useForge, Forger } from '@adexdsamson/forge/react-native';
import { Input, CustomButton } from 'your-components-library'; // Import your custom components

const Example = () => {
  const { ForgeForm, formState } = useForge();

  const signIn = async (data) => {
    // Handle sign-in logic
  }

  return (
    <ForgeForm onSubmit={signIn}>
      <Forger
        name="email"
        label="Email"
        component={Input}
      />

      <Forger
        name="password"
        label="Password"
        component={Input}
      />

      <CustomButton
        disabled={!formState.isValid}
        text="Sign in"
        type="submit" // important for submitting the form
      />
    </ForgeForm>
  );
};

```
or

```js
import React from 'react';
import { useForge } from '@adexdsamson/forge/react-native';
import { Input, CustomButton } from 'your-components-library'; // Import your custom components

const inputProps = [
   {
      name: "fullName",
      label: "Full Name",
      component: Input,
    },
    {
      name: "email",
      label: "Email",
      component: Input,
    },
]

const Example = () => {
  const { ForgeForm, formState } = useForge({
    fieldProps: inputProps,
  });

  const signIn = async (data) => {
    // Handle sign-in logic
  }

  return (
    <ForgeForm onSubmit={signIn}>
     <CustomButton
        disabled={!formState.isValid}
        text="Sign in"
        type="submit" // important for submitting the form
      />
    </ForgeForm>
  );
};
```
## API Reference

```ts
  useForge(options: ForgeProps): UseForgeResult
```
The useForge hook accepts an options object with the following properties:

- defaultValues (optional): Initial values for the form fields.
- resolver (optional): Resolver function for form validation.
- mode (optional): Submission mode for the form ('onBlur', 'onChange', 'onSubmit', 'onTouched', 'all').
- fieldProps (optional): pass input properties for generating form fields.

It returns an object containing form control functions and a form component.

`UseForgeFormResult`

The object returned by useForgeForm contains the following properties:

- register: Function to register form inputs.
- handleSubmit: Function to handle form submission.
- formState: Object containing the current state of the form.
- errors: Object containing validation errors.
- ForgeForm: Form component that wraps the form content and provides form control functions and properties.


## License

[MIT](https://choosealicense.com/licenses/mit/)

