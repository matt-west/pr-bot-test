const fs = require('fs');
const path = require('path');

// Create directory if it doesn't exist
const eventDir = path.join(__dirname); // __dirname is the current directory
const eventPath = path.join(eventDir, 'test-event.json');

// Mock the GitHub environment variables and dependencies
process.env.GITHUB_EVENT_PATH = eventPath;
process.env.GITHUB_TOKEN = 'fake-token';

// Override the required modules before requiring check-colors.js
const originalRequire = require('module').prototype.require;
require('module').prototype.require = function(path) {
  if (path === '@octokit/rest') {
    return {
      Octokit: class {
        constructor() {}
        pulls = {
          createReview: async ({ body }) => {
            console.log('Would post PR review comment:', body);
          }
        }
      }
    };
  }
  if (path === 'child_process') {
    return {
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
    };
  }
  return originalRequire.apply(this, arguments);
};

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
try {
  fs.writeFileSync(eventPath, JSON.stringify(mockEvent, null, 2));
  console.log('Created test event file at:', eventPath);
} catch (error) {
  console.error('Error creating test event file:', error);
  process.exit(1);
}

// Run the actual check
require('./check-colors.js');

// Clean up - remove the test file after we're done
process.on('exit', () => {
  try {
    fs.unlinkSync(eventPath);
    console.log('Cleaned up test event file');
  } catch (error) {
    console.error('Error cleaning up test event file:', error);
  }
}); 