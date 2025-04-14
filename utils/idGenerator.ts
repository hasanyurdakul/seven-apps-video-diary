import * as Random from 'expo-random';

export const generateId = (): string => {
  const randomBytes = Random.getRandomBytes(16); // 16 bytes for a UUID
  const hexString = Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  // Format as UUID (v4)
  return `${hexString.substring(0, 8)}-${hexString.substring(8, 4)}-4${hexString.substring(12, 3)}-${((parseInt(hexString.substring(15, 1), 16) & 0x3) | 0x8).toString(16)}${hexString.substring(16, 3)}-${hexString.substring(20)}`;
};
