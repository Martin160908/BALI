import { describe, expect, it } from 'vitest';
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
} from '../password-reset';

describe('password reset helpers', () => {
  it('creates unique, URL-safe reset tokens', () => {
    const firstToken = createPasswordResetToken();
    const secondToken = createPasswordResetToken();

    expect(firstToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondToken).not.toBe(firstToken);
  });

  it('stores a SHA-256 digest instead of the reset token', () => {
    const token = createPasswordResetToken();
    const tokenHash = hashPasswordResetToken(token);

    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenHash).not.toContain(token);
    expect(hashPasswordResetToken(token)).toBe(tokenHash);
  });

  it('keeps password hashes compatible with the existing login', () => {
    expect(hashPassword('Admin123!')).toBe(
      '3eb3fe66b31e3b4d10fa70b5cad49c7112294af6ae4e476a1c405155d45aa121',
    );
  });
});
