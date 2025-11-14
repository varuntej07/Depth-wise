import Anthropic from '@anthropic-ai/sdk';

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
}

interface GeneratedBranch {
  title: string;
  summary: string;
  depthPreview?: string;
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
2. Generate 3 distinct branches that cover different aspects
3. Branches should be parallel concepts, not sequential steps
4. Use clear, specific titles (not generic like "Learn More")
5. Provide brief summaries (1-2 sentences)
6. Maintain consistency with previous explanations

Output Format (JSON):
{
  "answer": "Comprehensive answer (3-4 sentences minimum, following the structure: Definition -> How it works -> Why it matters, with one concrete example)",
  "branches": [
    {
      "title": "Specific Topic Title",
      "summary": "One sentence preview of what this explores",
      "depthPreview": "Hint at what deeper level reveals"
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;

function buildPrompt(context: ExplorationContext): string {
  if (context.depth === 1) {
    // Root level - initial query
    return `User's question: "${context.rootQuery}"

Generate a comprehensive explanation following this structure:
1. DEFINITION: What it is (1 sentence)
2. HOW IT WORKS: The mechanism or process (1-2 sentences with concrete details)
3. WHY IT MATTERS: Practical significance (1 sentence)
4. EXAMPLE: One concrete, real-world example or analogy

MINIMUM 3-4 sentences total.

Then generate 4 exploration branches covering different aspects.

Branches should explore:
1. The user/application layer perspective
2. The system/infrastructure perspective
3. The underlying mechanisms
4. Related technologies or concepts

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

Generate a comprehensive answer about "${context.currentNode?.title || 'the topic'}" following this structure:
1. DEFINITION: What it is
2. HOW IT WORKS: The mechanism/process (if applicable to this topic)
3. WHY IT MATTERS: Practical significance or impact
4. EXAMPLE: One concrete example or analogy

MINIMUM 3-4 sentences total.

Then generate 3-5 branches that:
- Go DEEPER into technical details
- Cover different aspects of "${context.currentNode?.title || 'the topic'}"
- Are appropriate for depth level ${context.depth + 1}
- Do NOT repeat these topics: ${context.coveredTopics.join(', ')}

Each branch should be one level more technical than the parent.`;
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
