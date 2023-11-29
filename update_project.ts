import {repository_url} from './config/default.json';
import simpleGit, {SimpleGit} from 'simple-git';

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

    if (!status.files.length) {
      const currentBranch = await git.branchLocal();
      const branchName = currentBranch.current;

      await git.fetch();
      await git.pull('origin', branchName);

      console.log('PM2-Monitor successfully updated!');
    } else {
      console.log('Please commit or stash your changes before updating!');
    }
  } catch (error) {
    console.error(`Update Error: ${error}`);
  }
}

updateProject(repository_url);
