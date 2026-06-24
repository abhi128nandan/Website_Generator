export class ReasoningDetector {
  private static readonly FORBIDDEN_PHRASES = [
    "let me",
    "i think",
    "perhaps",
    "maybe",
    "okay",
    "the component",
    "the hook",
    "the service",
    "the props",
    "interface for props",
    "function for",
    "planning text",
    "design discussion",
    "architectural discussion",
    "component reasoning",
    "unfinished thoughts",
    "i will",
    "let's",
    "probably",
    "the component should",
    "the hook should",
    "hmm",
    "for example",
    "let me think",
    "the user wants",
    "first we",
    "next we",
    "i'll",
    "let's create",
    "we need to",
    "interface would be something like",
    "function will be called",
    "the user said"
  ];

  static detectReasoning(targetText: string): { hasReasoning: boolean; matchedPhrase?: string } {
    const lowerText = targetText.toLowerCase();

    for (const phrase of this.FORBIDDEN_PHRASES) {
      // Escape any special regex characters in the phrase
      const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      
      // Use word boundaries for safe matching
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, 'i');
      if (regex.test(lowerText)) {
        return { hasReasoning: true, matchedPhrase: phrase };
      }
    }

    return { hasReasoning: false };
  }
}
