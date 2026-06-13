import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E Craftea
 * 
 * Documentation: https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  testDir: './e2e',
  
  // Timeout pour chaque test
  timeout: 60 * 1000,
  
  // Nombre de tentatives en cas d'échec
  retries: process.env.CI ? 2 : 0,
  
  // Exécution des tests
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter pour les résultats
  reporter: [
    ['html'],
    ['list'],
  ],
  
  use: {
    // URL de base de l'application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Capture d'écran en cas d'échec
    screenshot: 'only-on-failure',
    
    // Trace en cas d'échec
    trace: 'on-first-retry',
    
    // Timeout pour les actions
    actionTimeout: 15 * 1000,
    
    // Timeout pour les navigations
    navigationTimeout: 30 * 1000,
  },

  // Projets de test (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Décommenter pour tester sur d'autres navigateurs
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Tests mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  // Serveur de développement local (optionnel)
  // Playwright peut démarrer automatiquement le serveur Next.js
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
