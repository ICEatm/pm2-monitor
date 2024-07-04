import * as fs from 'fs-extra';
import {join} from 'path';

/**
 * Copies templates from the source directory to the build destination.
 * This script is necessary as TypeScript Compiler (tsc) cannot handle non-JavaScript files,
 * such as HTML files, during the compilation process.
 * It ensures that the required templates are copied to the build directory after compilation.
 */
const copyTemplates = async (): Promise<void> => {
  const sourceDir = join(__dirname, '../templates/');
  const destinationDir = join(__dirname, '../../build/src/templates/');

  try {
    console.log('Ensuring destination directory exists...');
    await fs.ensureDir(destinationDir);

    console.log('Copying templates...');
    await fs.copy(sourceDir, destinationDir);

    console.log('Templates copied successfully!');
  } catch (error) {
    console.error('Error copying templates:', error);
  }
};

copyTemplates().catch(error => {
  console.error('Unhandled error during template copy:', error);
  throw error;
});
