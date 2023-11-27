import * as fs from 'fs-extra';
import {join} from 'path';

/**
 * Copies templates from source directory to the build destination.
 * This script is necessary as TypeScript Compiler (tsc) cannot handle non-JavaScript files,
 * such as HTML files, during the compilation process.
 * It ensures that the required templates are copied to the build directory after compilation.
 */
const copyTemplates = async () => {
  const sourceDir = join(__dirname, '../templates/');
  const destinationDir = join(__dirname, '../../build/src/templates/');

  try {
    await fs.ensureDir(destinationDir);
    await fs.copy(sourceDir, destinationDir);

    console.log(
      'Compilation successful, and templates were copied successfully!'
    );
  } catch (err) {
    console.error('Error copying templates:', err);
  }
};

copyTemplates();
