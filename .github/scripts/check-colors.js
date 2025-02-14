const { execSync } = require('child_process');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function main() {
  // Get PR number from GitHub context
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const event = require(eventPath);
  const prNumber = event.pull_request.number;
  const repo = event.repository.name;
  const owner = event.repository.owner.login;

  // Get the diff of the PR
  const diffCommand = `git diff origin/${event.pull_request.base.ref}...origin/${event.pull_request.head.ref}`;
  const diff = execSync(diffCommand).toString();

  // Regular expression to match hex color codes (both 3 and 6 digits)
  const hexColorRegex = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
  
  // Find all new color codes in added lines (starting with '+')
  const newColors = new Set();
  const diffLines = diff.split('\n');
  
  for (const line of diffLines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const matches = line.match(hexColorRegex);
      if (matches) {
        matches.forEach(color => newColors.add(color.toLowerCase()));
      }
    }
  }

  if (newColors.size > 0) {
    const colorList = Array.from(newColors).join(', ');
    const comment = `⚠️ This PR introduces the following new color codes: ${colorList}\n\n` +
                   'Please ensure these colors are from our official color palette in ' +
                   '[Automattic/color-studio](https://github.com/Automattic/color-studio). ' +
                   'If you need a new color, please discuss it with the design team first.';

    // Post comment on PR
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: comment
    });
  }
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 