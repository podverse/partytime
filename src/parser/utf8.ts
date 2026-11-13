export function utf8ByteLength(text: string): number {
  let size = 0;

  for (let i = 0; i < text.length; i += 1) {
    const codeUnit = text.charCodeAt(i);

    if (codeUnit < 0x80) {
      size += 1;
    } else if (codeUnit < 0x800) {
      size += 2;
    } else {
      const isHighSurrogate = codeUnit >= 0xd800 && codeUnit <= 0xdbff;
      const nextCodeUnit = i + 1 < text.length ? text.charCodeAt(i + 1) : undefined;
      const isFollowedByLowSurrogate =
        nextCodeUnit !== undefined && nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff;

      if (isHighSurrogate && isFollowedByLowSurrogate) {
        size += 4;
        i += 1;
      } else {
        size += 3;
      }
    }
  }

  return size;
}

export function exceedsUtf8ByteLimit(text: string, limit: number): boolean {
  if (text.length > limit) {
    return true;
  }

  if (text.length * 3 <= limit) {
    return false;
  }

  return utf8ByteLength(text) > limit;
}
