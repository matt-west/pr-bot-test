const fs = require('fs');

// Mock the GitHub environment variables and dependencies
process.env.GITHUB_EVENT_PATH = '.github/scripts/test-event.json';
process.env.GITHUB_TOKEN = 'fake-token';

// Mock the Octokit class
jest.mock('@octokit/rest', () => ({
  Octokit: class {
    constructor() {}
    issues = {
      createComment: async ({ body }) => {
        console.log('Would post comment to PR:', body);
      }
    }
  }
}));

// Mock the execSync to return a test diff
const { execSync } = require('child_process');
jest.mock('child_process', () => ({
  execSync: () => `
diff --git a/styles.css b/styles.css
index 1234567..89abcdef 100644
--- a/styles.css
+++ b/styles.css
@@ -1,4 +1,4 @@
 .existing-class {
-  color: #fff;
+  color: #123456;
+  background: #f0f;
 }
`
}));

// Create a mock GitHub event payload
const mockEvent = {
  pull_request: {
    number: 123,
    base: { ref: 'main' },
    head: { ref: 'feature-branch' }
  },
  repository: {
    name: 'test-repo',
    owner: { login: 'test-owner' }
  }
};

// Write mock event file
fs.writeFileSync(
  process.env.GITHUB_EVENT_PATH,
  JSON.stringify(mockEvent, null, 2)
);

// Run the actual check
require('./check-colors.js'); 