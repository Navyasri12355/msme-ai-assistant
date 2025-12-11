import * as fc from 'fast-check';
import { encrypt, decrypt, encryptNumber, decryptNumber, isEncrypted } from './encryption';

describe('Encryption Utilities', () => {
  describe('Basic encryption/decryption', () => {
    it('should encrypt and decrypt strings correctly', () => {
      const plaintext = 'sensitive data';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should encrypt and decrypt numbers correctly', () => {
      const plainNumber = 12345.67;
      const encrypted = encryptNumber(plainNumber);
      const decrypted = decryptNumber(encrypted);
      
      expect(decrypted).toBe(plainNumber);
      expect(encrypted).not.toBe(plainNumber.toString());
    });

    it('should handle empty strings', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should detect encrypted format', () => {
      const encrypted = encrypt('test data');
      expect(isEncrypted(encrypted)).toBe(true);
      expect(isEncrypted('plain text')).toBe(false);
      expect(isEncrypted('only:two:parts')).toBe(true); // Has 3 parts
    });
  });

  describe('Property-Based Tests', () => {
    // Feature: msme-ai-assistant, Property 27: Sensitive data encryption
    // Validates: Requirements 9.3
    it('Property 27: For any sensitive data field, the stored value should be encrypted (not equal to plaintext)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 1000 }),
          (sensitiveData) => {
            // Encrypt the sensitive data
            const encrypted = encrypt(sensitiveData);
            
            // Property: Encrypted value should not equal plaintext
            expect(encrypted).not.toBe(sensitiveData);
            
            // Property: Encrypted value should have the expected format
            expect(isEncrypted(encrypted)).toBe(true);
            
            // Property: Decryption should recover the original value
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(sensitiveData);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 27: For any numeric sensitive data, the stored value should be encrypted', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -1000000, max: 1000000, noNaN: true }),
          (sensitiveNumber) => {
            // Encrypt the sensitive numeric data
            const encrypted = encryptNumber(sensitiveNumber);
            
            // Property: Encrypted value should not equal plaintext string representation
            expect(encrypted).not.toBe(sensitiveNumber.toString());
            
            // Property: Encrypted value should have the expected format
            expect(isEncrypted(encrypted)).toBe(true);
            
            // Property: Decryption should recover the original value
            const decrypted = decryptNumber(encrypted);
            expect(decrypted).toBeCloseTo(sensitiveNumber, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 27: Same plaintext should produce different ciphertexts (due to random IV)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt the same plaintext twice
            const encrypted1 = encrypt(plaintext);
            const encrypted2 = encrypt(plaintext);
            
            // Property: Different encryptions should produce different ciphertexts
            // (because of random IV)
            expect(encrypted1).not.toBe(encrypted2);
            
            // Property: Both should decrypt to the same plaintext
            expect(decrypt(encrypted1)).toBe(plaintext);
            expect(decrypt(encrypted2)).toBe(plaintext);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 27: Encryption should be reversible for all valid inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string({ minLength: 0, maxLength: 1000 }),
            fc.double({ min: -1000000, max: 1000000, noNaN: true }).map(n => n.toString())
          ),
          (data) => {
            // Encrypt and decrypt
            const encrypted = encrypt(data);
            const decrypted = decrypt(encrypted);
            
            // Property: Round-trip should preserve the original value
            expect(decrypted).toBe(data);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration with Models', () => {
    it('should handle transaction amounts as encrypted strings', () => {
      const amount = 15000.50;
      const encrypted = encryptNumber(amount);
      
      // Simulate database storage (as TEXT)
      const storedValue = encrypted;
      
      // Simulate retrieval and decryption
      const decrypted = typeof storedValue === 'string' 
        ? decryptNumber(storedValue) 
        : parseFloat(storedValue);
      
      expect(decrypted).toBe(amount);
    });

    it('should handle business profile location as encrypted string', () => {
      const location = '123 Main St, Mumbai, Maharashtra';
      const encrypted = encrypt(location);
      
      // Simulate database storage (as TEXT)
      const storedValue = encrypted;
      
      // Simulate retrieval and decryption
      const decrypted = decrypt(storedValue);
      
      expect(decrypted).toBe(location);
    });

    it('should handle optional monthly revenue encryption', () => {
      const revenue = 50000;
      const encrypted = encryptNumber(revenue);
      
      // Simulate database storage
      const storedValue = encrypted;
      
      // Simulate retrieval with conditional decryption
      const decrypted = storedValue 
        ? (typeof storedValue === 'string' ? decryptNumber(storedValue) : parseFloat(storedValue))
        : undefined;
      
      expect(decrypted).toBe(revenue);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid encrypted format', () => {
      expect(() => decrypt('invalid:format')).toThrow('Invalid encrypted data format');
      expect(() => decrypt('only-one-part')).toThrow('Invalid encrypted data format');
    });

    it('should handle null/undefined gracefully', () => {
      expect(encrypt('')).toBe('');
      expect(decrypt('')).toBe('');
    });
  });
});
