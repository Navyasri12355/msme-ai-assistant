# Data Encryption Utilities

## Overview

This module provides AES-256-GCM encryption for sensitive data fields in the MSME AI Assistant application. It ensures that financial and personal information is encrypted at rest in the database.

## Encrypted Fields

### Transaction Model
- **amount**: Financial transaction amounts are encrypted to protect sensitive financial data

### Business Profile Model
- **location**: Business location is encrypted to protect privacy
- **monthlyRevenue**: Revenue information is encrypted as sensitive financial data

## Usage

### Encrypting Data

```typescript
import { encrypt, encryptNumber } from '../utils/encryption';

// Encrypt string data
const encryptedLocation = encrypt('123 Main St, Mumbai');

// Encrypt numeric data
const encryptedAmount = encryptNumber(15000.50);
```

### Decrypting Data

```typescript
import { decrypt, decryptNumber } from '../utils/encryption';

// Decrypt string data
const location = decrypt(encryptedLocation);

// Decrypt numeric data
const amount = decryptNumber(encryptedAmount);
```

## Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: SHA-256 hash of the ENCRYPTION_KEY environment variable
- **IV Length**: 16 bytes (randomly generated for each encryption)
- **Auth Tag Length**: 16 bytes (for authenticated encryption)
- **Format**: `iv:authTag:encryptedData` (all base64 encoded)

## Security Considerations

1. **Encryption Key**: The ENCRYPTION_KEY must be:
   - At least 32 characters long
   - Stored securely (never committed to version control)
   - Rotated periodically in production
   - Different for each environment (dev, staging, production)

2. **Key Management**: 
   - Use environment variables for key storage
   - Consider using a key management service (AWS KMS, Azure Key Vault, etc.) in production
   - Implement key rotation procedures

3. **Database Storage**:
   - Encrypted fields are stored as TEXT in the database
   - Original numeric constraints are enforced at the application layer
   - Encrypted data is longer than plaintext (approximately 3x due to base64 encoding)

## Configuration

Set the encryption key in your `.env` file:

```bash
ENCRYPTION_KEY=your-secure-encryption-key-at-least-32-characters-long
```

**Important**: Never use the default key in production!

## Testing

Property-based tests verify that:
- Encrypted data does not equal plaintext
- Decryption correctly reverses encryption
- The same plaintext produces different ciphertexts (due to random IVs)

## Migration

If adding encryption to an existing database:

1. Run the migration script: `backend/db/migrations/001_add_encryption_support.sql`
2. Migrate existing data by reading, encrypting, and updating each record
3. Verify all data is correctly encrypted before deploying

## Performance Considerations

- Encryption/decryption adds minimal overhead (< 1ms per operation)
- Bulk operations should encrypt/decrypt in batches when possible
- Consider caching decrypted values in memory for frequently accessed data (with appropriate security measures)
