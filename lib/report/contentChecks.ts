/** Detect copied paragraphs, not shared terms or similar (but distinct) interpretations. */
export function findRepeatedParagraphs(sections: readonly { title: string; body: string }[]): string[] {
  const firstSeen = new Map<string, string>();
  const duplicates = new Set<string>();
  for (const { title, body } of sections) {
    for (const paragraph of body.split(/\r?\n\s*\r?\n/)) {
      const key = paragraph.normalize("NFC")
        .replace(/^\s*[─◆][^\n]*\n/, "")
        .replace(/^[\s•▸◆─]+/, "").replace(/\s/g, "");
      if (key.length < 45) continue;
      const previous = firstSeen.get(key);
      if (previous !== undefined) duplicates.add(previous === title ? title : `${previous} / ${title}`);
      else firstSeen.set(key, title);
    }
  }
  return [...duplicates];
}
