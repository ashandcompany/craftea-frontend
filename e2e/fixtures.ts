/**
 * Custom Playwright fixture that automatically sets up mock API routes
 * for every page before the test starts.
 *
 * Import `test` and `expect` from this file instead of '@playwright/test'
 * in any spec that should run against the mock backend.
 */

import { test as base } from '@playwright/test';
import { setupMockRoutes } from './mocks/setup-routes';

export const test = base.extend({
  page: async ({ page }, use) => {
    await setupMockRoutes(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
