import { Logger } from '@website-generator/shared';
import type { UserStory } from '../types';

/**
 * Extracts user stories from SRS text.
 *
 * Supported patterns:
 *   1. Canonical: "As a <role>, I want <action>[,] so that <benefit>"
 *   2. Short form: "As a <role>, I want <action>" (no benefit clause)
 *   3. Section-scoped bullets under "User Stories" headings
 *   4. Numbered lists: "1. As a user, I want to ..."
 */
export function extractUserStories(text: string): UserStory[] {
  const stories: UserStory[] = [];
  const seen = new Set<string>();

  // Pattern 1: Full canonical form (case-insensitive)
  // "As a <role>, I want [to] <action>, so that <benefit>"
  const fullPattern = /as\s+(?:a|an)\s+(.+?),?\s+I\s+want\s+(?:to\s+)?(.+?),?\s+so\s+that\s+(.+?)(?:\.|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = fullPattern.exec(text)) !== null) {
    const story = createStory(match[1], match[2], match[3]);
    const key = storyKey(story);
    if (!seen.has(key)) {
      seen.add(key);
      stories.push(story);
    }
  }

  // Pattern 2: Short form — no "so that" clause
  // "As a <role>, I want [to] <action>"
  const shortPattern = /as\s+(?:a|an)\s+(.+?),?\s+I\s+want\s+(?:to\s+)?(.+?)(?:\.|$)/gi;

  while ((match = shortPattern.exec(text)) !== null) {
    const action = match[2].trim();
    // Skip if this was already matched by the full pattern (it contains "so that")
    if (/so\s+that/i.test(action)) continue;

    const story = createStory(match[1], action, '');
    const key = storyKey(story);
    if (!seen.has(key)) {
      seen.add(key);
      stories.push(story);
    }
  }

  // Pattern 3: Section-scoped bullets
  // Look for "User Stories" section and extract bullet items
  const sectionStories = extractFromSection(text);
  for (const story of sectionStories) {
    const key = storyKey(story);
    if (!seen.has(key)) {
      seen.add(key);
      stories.push(story);
    }
  }

  Logger.info(`[Parser:UserStories] Extracted ${stories.length} user stories`);
  return stories;
}

/**
 * Extracts user stories from bullet points under "User Stories" section headings.
 * Falls back to treating each bullet as an action with "user" as the default role.
 */
function extractFromSection(text: string): UserStory[] {
  const stories: UserStory[] = [];

  // Find "User Stories" section
  const sectionMatch = text.match(
    /^#{1,4}\s+(?:user\s+stories|user\s+requirements|use\s+cases|functional\s+requirements)\s*$/im
  );
  if (!sectionMatch) return stories;

  // Get content after the heading until the next heading
  const afterHeading = text.slice(sectionMatch.index! + sectionMatch[0].length);
  const nextHeadingIndex = afterHeading.search(/^#{1,4}\s+/m);
  const sectionContent = nextHeadingIndex >= 0
    ? afterHeading.slice(0, nextHeadingIndex)
    : afterHeading;

  // Extract bullet items
  const bulletPattern = /^\s*[-*+]\s+(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = bulletPattern.exec(sectionContent)) !== null) {
    const line = match[1].trim();

    // Try to parse as a canonical user story
    const canonical = line.match(
      /as\s+(?:a|an)\s+(.+?),?\s+I\s+want\s+(?:to\s+)?(.+?)(?:,?\s+so\s+that\s+(.+?))?$/i
    );

    if (canonical) {
      stories.push(createStory(
        canonical[1],
        canonical[2],
        canonical[3] || ''
      ));
    } else {
      // Treat the whole bullet as an action with default role
      stories.push({
        role: 'user',
        action: line.replace(/\.$/, '').trim(),
        benefit: '',
      });
    }
  }

  return stories;
}

/** Creates a cleaned UserStory object. */
function createStory(role: string, action: string, benefit: string): UserStory {
  return {
    role: role.trim().toLowerCase(),
    action: action.trim().replace(/\.$/, ''),
    benefit: (benefit || '').trim().replace(/\.$/, ''),
  };
}

/** Generates a dedup key for a user story. */
function storyKey(story: UserStory): string {
  return `${story.role}|${story.action}`.toLowerCase();
}
