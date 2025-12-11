/**
 * Contact Name Lookup Module
 *
 * Queries the macOS Contacts database (AddressBook-v22.abcddb) to resolve
 * phone numbers and email addresses to contact names.
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Cache for contact lookups (phone/email -> display name)
let contactCache: Map<string, string> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Find all AddressBook database paths on the system
 */
function findContactDBPaths(): string[] {
  const paths: string[] = [];
  const homeDir = os.homedir();
  const addressBookDir = path.join(homeDir, 'Library', 'Application Support', 'AddressBook');

  // Main AddressBook database
  const mainDB = path.join(addressBookDir, 'AddressBook-v22.abcddb');
  if (fs.existsSync(mainDB)) {
    paths.push(mainDB);
  }

  // Source-specific databases (iCloud, Exchange, etc.)
  const sourcesDir = path.join(addressBookDir, 'Sources');
  if (fs.existsSync(sourcesDir)) {
    try {
      const sources = fs.readdirSync(sourcesDir);
      for (const source of sources) {
        const sourceDB = path.join(sourcesDir, source, 'AddressBook-v22.abcddb');
        if (fs.existsSync(sourceDB)) {
          paths.push(sourceDB);
        }
      }
    } catch (err) {
      console.error('Error reading AddressBook sources:', err);
    }
  }

  return paths;
}

/**
 * Normalize a phone number to digits only for matching
 * "+1 (555) 123-4567" -> "15551234567"
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  // Remove leading + if present
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  return normalized;
}

/**
 * Normalize an email address for matching (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Build the contact cache from all available AddressBook databases
 */
function buildContactCache(): Map<string, string> {
  const cache = new Map<string, string>();
  const dbPaths = findContactDBPaths();

  if (dbPaths.length === 0) {
    console.error('No AddressBook databases found');
    return cache;
  }

  for (const dbPath of dbPaths) {
    try {
      // Open database in read-only mode
      const db = new Database(dbPath, { readonly: true, fileMustExist: true });

      try {
        // Query contacts with phone numbers
        const phoneQuery = `
          SELECT
            r.ZFIRSTNAME as firstName,
            r.ZLASTNAME as lastName,
            r.ZNICKNAME as nickname,
            p.ZFULLNUMBER as phone
          FROM ZABCDRECORD r
          JOIN ZABCDPHONENUMBER p ON r.Z_PK = p.ZOWNER
          WHERE p.ZFULLNUMBER IS NOT NULL
        `;

        const phoneRows = db.prepare(phoneQuery).all() as Array<{
          firstName: string | null;
          lastName: string | null;
          nickname: string | null;
          phone: string;
        }>;

        for (const row of phoneRows) {
          const displayName = buildDisplayName(row.firstName, row.lastName, row.nickname);
          if (displayName && row.phone) {
            const normalizedPhone = normalizePhoneNumber(row.phone);
            if (normalizedPhone) {
              cache.set(normalizedPhone, displayName);
            }
          }
        }

        // Query contacts with email addresses
        const emailQuery = `
          SELECT
            r.ZFIRSTNAME as firstName,
            r.ZLASTNAME as lastName,
            r.ZNICKNAME as nickname,
            e.ZADDRESS as email
          FROM ZABCDRECORD r
          JOIN ZABCDEMAILADDRESS e ON r.Z_PK = e.ZOWNER
          WHERE e.ZADDRESS IS NOT NULL
        `;

        const emailRows = db.prepare(emailQuery).all() as Array<{
          firstName: string | null;
          lastName: string | null;
          nickname: string | null;
          email: string;
        }>;

        for (const row of emailRows) {
          const displayName = buildDisplayName(row.firstName, row.lastName, row.nickname);
          if (displayName && row.email) {
            const normalizedEmail = normalizeEmail(row.email);
            if (normalizedEmail) {
              cache.set(normalizedEmail, displayName);
            }
          }
        }

      } finally {
        db.close();
      }

    } catch (err) {
      // Log but continue - some DBs may be locked or inaccessible
      console.error(`Error reading AddressBook at ${dbPath}:`, err);
    }
  }

  console.error(`Contact cache built with ${cache.size} entries`);
  return cache;
}

/**
 * Build a display name from contact parts
 */
function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
  nickname: string | null
): string | null {
  // Prefer nickname if available
  if (nickname && nickname.trim()) {
    return nickname.trim();
  }

  // Build from first/last name
  const parts: string[] = [];
  if (firstName && firstName.trim()) {
    parts.push(firstName.trim());
  }
  if (lastName && lastName.trim()) {
    parts.push(lastName.trim());
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Get the contact cache, rebuilding if expired or not initialized
 */
function getContactCache(): Map<string, string> {
  const now = Date.now();

  if (!contactCache || (now - cacheTimestamp) > CACHE_TTL_MS) {
    contactCache = buildContactCache();
    cacheTimestamp = now;
  }

  return contactCache;
}

/**
 * Look up a contact name by phone number or email
 * Returns null if not found
 */
export function lookupContact(identifier: string): string | null {
  if (!identifier) {
    return null;
  }

  const cache = getContactCache();

  // Try as phone number first
  const normalizedPhone = normalizePhoneNumber(identifier);
  if (normalizedPhone && cache.has(normalizedPhone)) {
    return cache.get(normalizedPhone) || null;
  }

  // Also try with common country code variations
  // If the number doesn't have a country code, try adding US (+1)
  if (normalizedPhone.length === 10) {
    const withUS = '1' + normalizedPhone;
    if (cache.has(withUS)) {
      return cache.get(withUS) || null;
    }
  }
  // If the number has US country code, try without it
  if (normalizedPhone.startsWith('1') && normalizedPhone.length === 11) {
    const withoutUS = normalizedPhone.substring(1);
    if (cache.has(withoutUS)) {
      return cache.get(withoutUS) || null;
    }
  }

  // Try as email
  if (identifier.includes('@')) {
    const normalizedEmail = normalizeEmail(identifier);
    if (cache.has(normalizedEmail)) {
      return cache.get(normalizedEmail) || null;
    }
  }

  return null;
}

/**
 * Clear the contact cache (useful for testing or manual refresh)
 */
export function clearContactCache(): void {
  contactCache = null;
  cacheTimestamp = 0;
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { size: number; ageMs: number } {
  const cache = getContactCache();
  return {
    size: cache.size,
    ageMs: Date.now() - cacheTimestamp,
  };
}
