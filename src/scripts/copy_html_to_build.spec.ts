import {copyTemplates} from './copy_html_to_build';
import * as fs from 'fs-extra';
import {join} from 'path';

// Mock fs-extra module
jest.mock('fs-extra');

describe('copyTemplates', () => {
  const sourceDir = join(__dirname, '../templates/');
  const destinationDir = join(__dirname, '../../build/src/templates/');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should ensure the destination directory exists', async () => {
    await copyTemplates();

    expect(fs.ensureDir).toHaveBeenCalledWith(destinationDir);
  });

  it('should copy templates from source to destination', async () => {
    await copyTemplates();

    expect(fs.copy).toHaveBeenCalledWith(sourceDir, destinationDir);
  });

  it('should log success message on successful copy', async () => {
    console.log = jest.fn();

    await copyTemplates();

    expect(console.log).toHaveBeenCalledWith('Templates copied successfully!');
  });

  it('should handle errors during the copy process', async () => {
    const error = new Error('Test error');
    (fs.copy as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });
    console.error = jest.fn();

    await expect(copyTemplates()).rejects.toThrow(error);

    expect(console.error).toHaveBeenCalledWith(
      'Error copying templates:',
      error
    );
  });

  it('should handle unhandled errors during the copy process', async () => {
    const error = new Error('Unhandled error');
    (fs.copy as jest.Mock).mockImplementationOnce(() => {
      throw error;
    });
    console.error = jest.fn();

    await expect(copyTemplates()).rejects.toThrow(error);

    expect(console.error).toHaveBeenCalledWith(
      'Error copying templates:',
      error
    );
  });
});
