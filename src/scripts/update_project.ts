import {repository_url} from '../../config/default.json';
import simpleGit, {SimpleGit} from 'simple-git';

async function updateProject(repository: string): Promise<void> {
  const git: SimpleGit = simpleGit(repository);

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
