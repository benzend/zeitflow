import {
  encrypt,
  decrypt,
  isEncrypted,
  hashValue,
  encryptConfigSecrets,
  decryptConfigSecrets,
} from '@/lib/encryption';

// Set a test encryption key (32 bytes = 64 hex chars)
const TEST_KEY = 'a'.repeat(64);

beforeAll(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

afterAll(() => {
  delete process.env.ENCRYPTION_KEY;
});

describe('encrypt / decrypt', () => {
  it('should round-trip a string', () => {
    const plaintext = 'my-secret-api-key-12345';
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).not.toBeNull();
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it('should return null for null/undefined input', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
  });

  it('should produce different ciphertexts for the same plaintext (unique IV)', () => {
    const plaintext = 'same-value';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
    // But both decrypt to the same value
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it('should handle empty string', () => {
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('should handle unicode and special characters', () => {
    const plaintext = 'token-with-émojis-🔑-and-日本語';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });

  it('should pass through unencrypted values in decrypt (migration support)', () => {
    const plaintext = 'zf_plain_token_not_encrypted';
    expect(decrypt(plaintext)).toBe(plaintext);
  });
});

describe('isEncrypted', () => {
  it('should detect encrypted values', () => {
    const encrypted = encrypt('test')!;
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it('should reject plain text', () => {
    expect(isEncrypted('plain-text-token')).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
  });
});

describe('hashValue', () => {
  it('should produce consistent SHA-256 hex hashes', () => {
    const hash1 = hashValue('my-token');
    const hash2 = hashValue('my-token');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
  });

  it('should produce different hashes for different inputs', () => {
    expect(hashValue('token-a')).not.toBe(hashValue('token-b'));
  });
});

describe('encryptConfigSecrets / decryptConfigSecrets', () => {
  it('should encrypt and decrypt known secret keys', () => {
    const config = {
      apiKey: 'sk-secret-123',
      channel: '#general',
      message: 'Hello world',
    };

    const encrypted = encryptConfigSecrets(config);
    expect(encrypted.channel).toBe('#general'); // non-secret — unchanged
    expect(encrypted.message).toBe('Hello world'); // non-secret — unchanged
    expect(encrypted.apiKey).not.toBe('sk-secret-123'); // secret — encrypted
    expect(isEncrypted(encrypted.apiKey as string)).toBe(true);

    const decrypted = decryptConfigSecrets(encrypted);
    expect(decrypted.apiKey).toBe('sk-secret-123');
    expect(decrypted.channel).toBe('#general');
  });

  it('should handle nested config objects (e.g. emailConfig)', () => {
    const config = {
      emailConfig: {
        to: 'user@example.com',
        resendApiKey: 're_live_abc123',
        subject: 'Test',
      },
      aiConfig: {
        model: 'gpt-4',
        userPrompt: 'Summarize this',
      },
    };

    const encrypted = encryptConfigSecrets(config);
    const emailConfig = encrypted.emailConfig as Record<string, unknown>;
    expect(emailConfig.to).toBe('user@example.com'); // not a secret key
    expect(isEncrypted(emailConfig.resendApiKey as string)).toBe(true);
    expect(emailConfig.subject).toBe('Test');

    const aiConfig = encrypted.aiConfig as Record<string, unknown>;
    expect(aiConfig.model).toBe('gpt-4'); // not a secret key
    expect(aiConfig.userPrompt).toBe('Summarize this');

    const decrypted = decryptConfigSecrets(encrypted);
    const decryptedEmail = decrypted.emailConfig as Record<string, unknown>;
    expect(decryptedEmail.resendApiKey).toBe('re_live_abc123');
  });

  it('should skip already-encrypted values (idempotent)', () => {
    const config = { apiKey: 'my-key' };
    const once = encryptConfigSecrets(config);
    const twice = encryptConfigSecrets(once);
    // The already-encrypted value should not be double-encrypted
    expect(decryptConfigSecrets(twice).apiKey).toBe('my-key');
  });

  it('should handle all known secret keys', () => {
    const config: Record<string, string> = {
      apiKey: 'v1',
      apiToken: 'v2',
      botToken: 'v3',
      token: 'v4',
      accessToken: 'v5',
      secretKey: 'v6',
      authToken: 'v7',
      authValue: 'v8',
      twilioAuthToken: 'v9',
      smtpPass: 'v10',
      resendApiKey: 'v11',
      webhookUrl: 'v12',
    };

    const encrypted = encryptConfigSecrets(config);
    for (const key of Object.keys(config)) {
      expect(isEncrypted(encrypted[key] as string)).toBe(true);
    }

    const decrypted = decryptConfigSecrets(encrypted);
    for (const [key, value] of Object.entries(config)) {
      expect(decrypted[key]).toBe(value);
    }
  });
});

describe('error handling', () => {
  it('should throw if ENCRYPTION_KEY is missing', () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY environment variable is required');
    process.env.ENCRYPTION_KEY = savedKey;
  });

  it('should throw if ENCRYPTION_KEY is wrong length', () => {
    const savedKey = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = 'tooshort';
    expect(() => encrypt('test')).toThrow('64-character hex string');
    process.env.ENCRYPTION_KEY = savedKey;
  });
});
