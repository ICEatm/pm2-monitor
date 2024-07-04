import {repository_url} from './config/default.json';
import simpleGit, {SimpleGit} from 'simple-git';

/**
 * Updates the local repository by fetching and pulling the latest changes from the remote repository.
 *
 * @param repository - The URL of the repository to update.
 */
async function updateProject(repository: string): Promise<void> {
  console.log(`Attempting to update repository at: ${repository}`);

  const git: SimpleGit = simpleGit({
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  });

  try {
    const status = await git.status();
    console.log('Git status retrieved:', status);

    if (!status.files.length) {
      const currentBranch = await git.branchLocal();
      const branchName = currentBranch.current;
      console.log(`Current branch: ${branchName}`);

      console.log('Fetching latest changes...');
      await git.fetch();

      console.log('Pulling latest changes...');
      await git.pull('origin', branchName);

      console.log('PM2-Monitor successfully updated!');
    } else {
      console.log('Please commit or stash your changes before updating!');
    }
  } catch (error) {
    console.error('Update Error:', error);
  }
}

// Invoke the update function
updateProject(repository_url).catch(error => {
  console.error('Unhandled error during project update:', error);
  throw error;
});
