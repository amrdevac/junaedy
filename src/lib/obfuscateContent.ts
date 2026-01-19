const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/~`";
const WHITESPACE_TEST = /\s/;

const SEED_MODULUS = 2147483647; // 2^31 - 1
const SEED_MULTIPLIER = 16807; // bsd rand

const normalizeSeed = (seedSource: string | number) => {
  const seedString = typeof seedSource === "number" ? String(seedSource) : seedSource;
  let hash = 0;
  for (let index = 0; index < seedString.length; index += 1) {
    hash = (hash * 31 + seedString.charCodeAt(index)) >>> 0;
  }
  if (hash === 0) {
    hash = 1;
  }
  return hash % SEED_MODULUS;
};

const createSeededGenerator = (seedInput: string | number) => {
  let value = normalizeSeed(seedInput);
  if (value <= 0) {
    value = 1;
  }
  return () => {
    value = (value * SEED_MULTIPLIER) % SEED_MODULUS;
    return (value - 1) / (SEED_MODULUS - 1);
  };
};

export function obfuscateContent(source: string, seedSource: string | number) {
  if (!source) return "";
  const random = createSeededGenerator(seedSource);
  let masked = "";
  for (const char of source) {
    if (WHITESPACE_TEST.test(char)) {
      masked += char;
      continue;
    }
    const nextIndex = Math.floor(random() * CHARSET.length);
    masked += CHARSET[nextIndex];
  }
  return masked;
}
