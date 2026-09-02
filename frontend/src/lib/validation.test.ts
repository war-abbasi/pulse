import { describe, expect, it } from 'vitest';
import {
  hasErrors,
  validateLogin,
  validateNotification,
  validateRegister,
  type RegisterForm,
} from './validation';
import { Category } from '../types';

const validRegister: RegisterForm = {
  fullName: 'Ada Lovelace',
  username: 'ada',
  password: 'secret123',
  confirmPassword: 'secret123',
};

describe('validateLogin', () => {
  it('accepts a filled-in form', () => {
    expect(validateLogin({ username: 'ada', password: 'secret123' })).toEqual({});
  });

  it('rejects a blank username, including one that is only whitespace', () => {
    expect(validateLogin({ username: '   ', password: 'x' }).username).toBeDefined();
  });

  it('rejects a missing password', () => {
    expect(validateLogin({ username: 'ada', password: '' }).password).toBeDefined();
  });
});

describe('validateRegister', () => {
  it('accepts a valid form', () => {
    expect(validateRegister(validRegister)).toEqual({});
  });

  it('rejects a username containing spaces', () => {
    const errors = validateRegister({ ...validRegister, username: 'ada lovelace' });
    expect(errors.username).toMatch(/spaces/i);
  });

  it('rejects a username shorter than three characters', () => {
    expect(validateRegister({ ...validRegister, username: 'ad' }).username).toBeDefined();
  });

  it('rejects a password shorter than six characters', () => {
    const errors = validateRegister({
      ...validRegister,
      password: '12345',
      confirmPassword: '12345',
    });
    expect(errors.password).toMatch(/6 characters/i);
  });

  it('rejects a password longer than bcrypt can actually read', () => {
    // bcrypt ignores anything past 72 bytes, so accepting it would be a lie
    // about the security being provided.
    const long = 'a'.repeat(73);
    const errors = validateRegister({
      ...validRegister,
      password: long,
      confirmPassword: long,
    });
    expect(errors.password).toBeDefined();
  });

  it('accepts a password of exactly 72 characters', () => {
    const max = 'a'.repeat(72);
    const errors = validateRegister({
      ...validRegister,
      password: max,
      confirmPassword: max,
    });
    expect(errors.password).toBeUndefined();
  });

  it('rejects mismatched confirmation', () => {
    const errors = validateRegister({ ...validRegister, confirmPassword: 'different' });
    expect(errors.confirmPassword).toMatch(/match/i);
  });

  it('reports every problem at once rather than one at a time', () => {
    const errors = validateRegister({
      fullName: '',
      username: 'a b',
      password: '123',
      confirmPassword: 'xyz',
    });
    expect(Object.keys(errors).sort()).toEqual([
      'confirmPassword',
      'fullName',
      'password',
      'username',
    ]);
  });
});

describe('validateNotification', () => {
  const valid = { header: 'Deploy finished', body: 'Version 2.1 is live', category: Category.INFO };

  it('accepts a valid notification', () => {
    expect(validateNotification(valid)).toEqual({});
  });

  it('rejects a header that is only whitespace', () => {
    expect(validateNotification({ ...valid, header: '   ' }).header).toBeDefined();
  });

  it('rejects a body that is only whitespace', () => {
    expect(validateNotification({ ...valid, body: '  \n ' }).body).toBeDefined();
  });

  it('rejects a header over 120 characters', () => {
    expect(validateNotification({ ...valid, header: 'a'.repeat(121) }).header).toBeDefined();
  });

  it('rejects a missing category', () => {
    expect(validateNotification({ ...valid, category: '' }).category).toBeDefined();
  });
});

describe('hasErrors', () => {
  it('is false for an empty object', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('ignores keys explicitly set to undefined', () => {
    // setField clears errors by assigning undefined rather than deleting the
    // key, so this case happens constantly in the forms.
    expect(hasErrors({ username: undefined })).toBe(false);
  });

  it('is true when any message is present', () => {
    expect(hasErrors({ username: undefined, password: 'Required.' })).toBe(true);
  });
});
