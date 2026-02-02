import Anthropic from '@anthropic-ai/sdk';
import { QueryIntent, QueryComplexity, QueryClassification, FollowUpType } from '@/types/graph';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ExplorationContext {
  rootQuery: string;
  currentNode?: {
    title: string;
    content: string;
  };
  path: string[];
  depth: number;
  coveredTopics: string[];
  classification?: QueryClassification; // pass classification for dynamic branching
  exploreType?: FollowUpType; // what type of exploration the user requested
}

interface GeneratedBranch {
  title: string;
  summary: string;
  depthPreview?: string;
  followUpType: FollowUpType;
}

// Classification prompt - lightweight, uses haiku for speed/cost
const CLASSIFICATION_PROMPT = `You are a query classifier. Analyze the user's question and classify it.

Return ONLY valid JSON with this structure:
{
  "intent": "factual" | "conceptual" | "technical" | "comparative" | "exploratory",
  "complexity": "simple" | "moderate" | "complex",
  "suggestedBranchCount": 2-5
}

Intent definitions:
- factual: Simple fact-based questions (Why is sky blue?, What year did X happen?)
- conceptual: Understanding concepts/ideas (What is Kubernetes?, What is machine learning?)
- technical: How things work, implementation details (How does OAuth work?, How to implement X?)
- comparative: Comparing options/alternatives (React vs Vue, SQL vs NoSQL)
- exploratory: Open-ended research (Tell me about quantum computing, Explain blockchain)

Complexity guide:
- simple: Direct answer, 2-3 branches sufficient
- moderate: Multi-faceted, 3-4 branches appropriate
- complex: Deep topic, 4-5 branches needed

Return ONLY JSON, no markdown.`;

/**
 * Classify a query to determine its intent and complexity.
 * Uses Haiku for speed and cost efficiency.
 */
export async function classifyQuery(query: string): Promise<QueryClassification> {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      system: CLASSIFICATION_PROMPT,
      messages: [{ role: 'user', content: `Classify this query: "${query}"` }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text);
    return {
      intent: result.intent as QueryIntent,
      complexity: result.complexity as QueryComplexity,
      suggestedBranchCount: Math.min(5, Math.max(2, result.suggestedBranchCount)),
    };
  } catch (error) {
    console.error('Query classification failed, using defaults:', error);
    // Fallback to moderate complexity if classification fails
    return {
      intent: 'conceptual',
      complexity: 'moderate',
      suggestedBranchCount: 4,
    };
  }
}

const SYSTEM_PROMPT = `You are a knowledge exploration assistant. Your role is to help users build visual knowledge graphs by generating progressively deeper explanations.

Content Structure Rules:
1. MINIMUM 3-4 sentences per answer
2. MUST include one concrete example or real-world analogy
3. Follow this structure:
   - Definition: What it is
   - How it works: The mechanism/process (if relevant to the topic)
   - Why it matters: Practical significance or impact

Branch Generation Rules:
1. Each level should be MORE TECHNICAL than the previous
2. Branches should be parallel concepts, not sequential steps
3. Use clear, specific titles (not generic like "Learn More")
4. Provide brief summaries (1-2 sentences)
5. Maintain consistency with previous explanations
6. IMPORTANT: Each branch MUST have a followUpType that indicates what it explores:
   - "why": Explains motivation, reasoning, or causation
   - "how": Explains mechanism, process, or implementation
   - "what": Defines components, types, or variations
   - "example": Provides real-world cases or applications
   - "compare": Shows tradeoffs or alternatives
7. Ensure DIVERSITY in followUpTypes - don't make all branches the same type

Output Format (JSON):
{
  "answer": "Comprehensive answer (3-4 sentences minimum, following the structure: Definition -> How it works -> Why it matters, with one concrete example)",
  "branches": [
    {
      "title": "Specific Topic Title",
      "summary": "One sentence preview of what this explores",
      "depthPreview": "Hint at what deeper level reveals",
      "followUpType": "why" | "how" | "what" | "example" | "compare"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

function buildPrompt(context: ExplorationContext): string {
  const branchCount = context.classification?.suggestedBranchCount ?? 4;
  const intentGuidance = getIntentGuidance(context.classification?.intent);
  const exploreTypeGuidance = context.exploreType
    ? getExploreTypeGuidance(context.exploreType)
    : '';

  if (context.depth === 1) {
    // Root level - initial query
    return `User's question: "${context.rootQuery}"

${intentGuidance}

Generate a comprehensive explanation following this structure:
1. DEFINITION: What it is (1 sentence)
2. HOW IT WORKS: The mechanism or process (1-2 sentences with concrete details)
3. WHY IT MATTERS: Practical significance (1 sentence)
4. EXAMPLE: One concrete, real-world example or analogy

MINIMUM 3-4 sentences total.

Then generate exactly ${branchCount} exploration branches covering different aspects.

Each branch MUST have a followUpType ("why", "how", "what", "example", or "compare").
Ensure diversity - include at least 2 different followUpTypes.

Branches should explore:
- The user/application layer perspective (followUpType: "what" or "example")
- The system/infrastructure perspective (followUpType: "how")
- The underlying mechanisms (followUpType: "how" or "why")
- Related technologies or concepts (followUpType: "compare" or "example")

Focus on WHAT happens first, technical details come in deeper levels.

Depth progression guide:
- Level 1-2: Conceptual (for general audience)
- Level 3-4: Technical (for practitioners)
- Level 5-6: Implementation (code-level details)
- Level 7+: Foundational (theory, math, physics)`;
  }

  // Deeper levels
  return `User's original question: "${context.rootQuery}"

Current exploration path: ${context.path.join(' → ')}

${
  context.currentNode
    ? `Current node: "${context.currentNode.title}"
Content: "${context.currentNode.content}"`
    : ''
}

Current depth level: ${context.depth}
Target depth: ${context.depth + 1}

Previously covered topics: ${context.coveredTopics.join(', ')}

${exploreTypeGuidance}

Generate a comprehensive answer about "${context.currentNode?.title || 'the topic'}" following this structure:
1. DEFINITION: What it is
2. HOW IT WORKS: The mechanism/process (if applicable to this topic)
3. WHY IT MATTERS: Practical significance or impact
4. EXAMPLE: One concrete example or analogy

MINIMUM 3-4 sentences total.

Then generate ${branchCount} branches that:
- Go DEEPER into technical details
- Cover different aspects of "${context.currentNode?.title || 'the topic'}"
- Are appropriate for depth level ${context.depth + 1}
- Do NOT repeat these topics: ${context.coveredTopics.join(', ')}
- Each branch MUST have a followUpType ("why", "how", "what", "example", or "compare")
- Ensure diversity in followUpTypes

Each branch should be one level more technical than the parent.`;
}

/**
 * Get guidance based on query intent to help Claude generate appropriate content
 */
function getIntentGuidance(intent?: QueryIntent): string {
  switch (intent) {
    case 'factual':
      return 'This is a factual question. Provide a clear, direct answer with supporting details. Focus on accuracy.';
    case 'conceptual':
      return 'This is a conceptual question about understanding an idea. Explain the concept clearly with good analogies.';
    case 'technical':
      return 'This is a technical question. Provide implementation-focused details and practical guidance.';
    case 'comparative':
      return 'This is a comparative question. Highlight key differences, tradeoffs, and when to use each option.';
    case 'exploratory':
      return 'This is an open-ended research question. Provide a broad overview with multiple angles to explore.';
    default:
      return '';
  }
}

/**
 * Get guidance based on user's requested exploration type
 */
function getExploreTypeGuidance(exploreType: FollowUpType): string {
  switch (exploreType) {
    case 'why':
      return 'The user wants to understand WHY - focus on motivation, reasoning, causation, and purpose.';
    case 'how':
      return 'The user wants to understand HOW - focus on mechanisms, processes, and implementation details.';
    case 'what':
      return 'The user wants to understand WHAT - focus on definitions, components, and variations.';
    case 'example':
      return 'The user wants EXAMPLES - focus on real-world cases, applications, and practical scenarios.';
    case 'compare':
      return 'The user wants COMPARISONS - focus on tradeoffs, alternatives, and when to use different options.';
    default:
      return '';
  }
}

export async function generateBranches(
  context: ExplorationContext
): Promise<{ answer: string; branches: GeneratedBranch[] }> {
  const prompt = buildPrompt(context);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000, // Increased to accommodate longer, more detailed responses
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  try {
    const result = JSON.parse(content.text);
    return {
      answer: result.answer || '',
      branches: result.branches || [],
    };
  } catch {
    console.error('Failed to parse Claude response:', content.text);
    throw new Error('Failed to parse AI response');
  }
}

export { anthropic };