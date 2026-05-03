import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  // During build or if missing, we throw an error in production but 
  // maybe we should be more graceful in dev. 
  // However, tokens MUST be encrypted.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY must be set in production');
  }
}

/**
 * Encrypts a string using AES-256-GCM
 * @param text The text to encrypt
 * @returns Encrypted string in format: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) return text; // Fallback for dev if not set (NOT SAFE FOR PROD)

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string encrypted by the encrypt function
 * @param encryptedText The text to decrypt (iv:authTag:encryptedText)
 * @returns Decrypted string
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) return encryptedText; // Fallback for dev

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // If not encrypted, return as is (for legacy or mock data)
      return encryptedText;
    }

    const [ivHex, authTagHex, textHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(textHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText; // Return original if decryption fails
  }
}
