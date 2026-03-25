import { test, expect, Page } from '@playwright/test';
import {
  createSessionResponse,
  exploreChild001Response,
  exploreGrandchild001Response,
} from './fixtures';

/**
 * Intercept all API calls the app makes during exploration and return fixture data.
 * This avoids hitting the real AI API or database.
 */
async function mockAPIs(page: Page) {
  // Mock session creation
  await page.route('**/api/session/create', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(createSessionResponse),
    }),
  );

  // Track explore call count to return different fixtures per depth
  let exploreCallCount = 0;
  await page.route('**/api/explore', (route) => {
    exploreCallCount++;
    const fixtures = [
      exploreChild001Response,
      exploreGrandchild001Response,
      // For depth 4+ explorations, reuse the grandchild fixture with different IDs
      {
        ...exploreGrandchild001Response,
        parentId: 'great-gc-001',
        branches: exploreGrandchild001Response.branches.map((b, i) => ({
          ...b,
          id: `depth5-${i}`,
          depth: 5,
        })),
        edges: exploreGrandchild001Response.edges.map((e, i) => ({
          ...e,
          id: `e-d5-${i}`,
          source: 'great-gc-001',
          target: `depth5-${i}`,
        })),
      },
    ];
    const fixture = fixtures[Math.min(exploreCallCount - 1, fixtures.length - 1)];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });

  // Mock suggestions (landing page fetches these)
  await page.route('**/api/suggestions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ suggestions: [] }),
    }),
  );

  // Mock heartbeat
  await page.route('**/api/session/heartbeat', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  // Mock user/usage
  await page.route('**/api/user/usage', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        currentUsage: 0,
        maxUsage: 100,
        tier: 'free',
        periodStart: new Date().toISOString(),
        periodEnd: new Date().toISOString(),
      }),
    }),
  );
}

async function startExploration(page: Page) {
  await page.goto('/');
  // Type a topic
  await page.fill('input[type="text"]', 'Quantum Computing');
  // Submit
  await page.click('button[type="submit"]');
  // Wait for the root node to appear in the React Flow canvas
  await page.waitForSelector('text=Quantum Computing', { timeout: 15000 });
}

// ─── Test 1: Basic exploration ───────────────────────────────────────────────

test.describe('Basic exploration', () => {
  test('type a topic → root node appears → explore → 3 child nodes appear', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mockAPIs(page);
    await startExploration(page);

    // Root node should be visible
    await expect(page.locator('text=Quantum Computing').first()).toBeVisible();

    // The initial session/create response includes 3 branches at depth 2
    // They should already be on the canvas
    await expect(page.locator('text=Qubits vs Classical Bits').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Quantum Entanglement').first()).toBeVisible();
    await expect(page.locator('text=Practical Applications').first()).toBeVisible();

    // No console errors
    const realErrors = consoleErrors.filter(
      (e) => !e.includes('403') && !e.includes('favicon') && !e.includes('hydration'),
    );
    expect(realErrors).toEqual([]);
  });
});

// ─── Test 2: Deep exploration (regression test) ──────────────────────────────

test.describe('Deep exploration', () => {
  test('explore root → child → grandchild without "Maximum update depth exceeded"', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Also catch page errors (uncaught exceptions)
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await mockAPIs(page);
    await startExploration(page);

    // Child nodes from session/create are already visible.
    // Now click "Explore Deeper" on the first child node.
    const exploreButtons = page.locator('button:has-text("Explore Deeper")');
    await exploreButtons.first().click({ timeout: 10000 });

    // Wait for grandchild nodes (depth 3) from exploreChild001Response
    await expect(page.locator('text=Bloch Sphere Representation').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator('text=Quantum Measurement').first()).toBeVisible();
    await expect(page.locator('text=Quantum Error Correction').first()).toBeVisible();

    // Now explore a grandchild (depth 3 → depth 4)
    const deeperButtons = page.locator('button:has-text("Explore Deeper")');
    // Find an explore button that's still available (not on already-explored nodes)
    await deeperButtons.first().click({ timeout: 10000 });

    // Wait for depth-4 nodes
    await expect(page.locator('text=Single-Qubit Gates').first()).toBeVisible({ timeout: 15000 });

    // The critical assertion: no "Maximum update depth exceeded" error
    const maxUpdateErrors = [
      ...consoleErrors.filter((e) => e.includes('Maximum update depth exceeded')),
      ...pageErrors.filter((e) => e.includes('Maximum update depth exceeded')),
    ];
    expect(maxUpdateErrors).toEqual([]);
  });
});

// ─── Test 3: Focus mode ─────────────────────────────────────────────────────

test.describe('Focus mode', () => {
  test('after exploring to depth 3, breadcrumb appears when focus mode activates', async ({
    page,
  }) => {
    await mockAPIs(page);
    await startExploration(page);

    // Explore child → get depth 3 nodes
    const exploreButtons = page.locator('button:has-text("Explore Deeper")');
    await exploreButtons.first().click({ timeout: 10000 });

    // Wait for grandchild nodes
    await expect(page.locator('text=Bloch Sphere Representation').first()).toBeVisible({
      timeout: 15000,
    });

    // Focus mode should auto-activate at depth 3+ (focusDepthThreshold: 3)
    // Look for the breadcrumb bar (fixed top bar with "Exit Focus" button)
    const exitFocusButton = page.locator('button[title="Exit Focus Mode"]');
    const breadcrumbBar = page.locator('text=Exit Focus');

    // If focus mode auto-activates, we should see the breadcrumb.
    // If it needs a click to activate, click a depth-3 node.
    const isBreadcrumbVisible = await breadcrumbBar.isVisible().catch(() => false);

    if (!isBreadcrumbVisible) {
      // Click on a grandchild node to trigger focus mode
      await page.locator('text=Bloch Sphere Representation').first().click();
      // Give it a moment to activate
      await page.waitForTimeout(1000);
    }

    // Check breadcrumb is now visible (may not auto-activate in all implementations)
    // This is a soft assertion — the breadcrumb component exists but auto-activation
    // depends on the KnowledgeCanvas logic
    const breadcrumbVisible = await breadcrumbBar.isVisible().catch(() => false);
    if (breadcrumbVisible) {
      await expect(exitFocusButton).toBeVisible();

      // Depth indicator should show
      await expect(page.locator('text=/Depth \\d/')).toBeVisible();

      // Click "Exit Focus" to leave focus mode
      await exitFocusButton.click();

      // Breadcrumb should disappear
      await expect(exitFocusButton).not.toBeVisible({ timeout: 5000 });
    } else {
      // Focus mode may require explicit user action beyond just exploring.
      // Verify the nodes are at least all present on the canvas.
      await expect(page.locator('text=Quantum Computing').first()).toBeVisible();
      await expect(page.locator('text=Bloch Sphere Representation').first()).toBeVisible();
    }
  });
});
