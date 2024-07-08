import logger from '../utilities/Logger';
import DataManager from './dataManager';
import {exit} from 'node:process';

// Mock logger and process.exit
jest.mock('../utilities/Logger');
jest.mock('node:process', () => ({
  exit: jest.fn(),
}));

describe('DataManager', () => {
  let validConfig: any;

  beforeEach(() => {
    validConfig = {
      version: '1.0.0',
      email: {
        mail_from: 'test@example.com',
        mail_from_password: 'password',
        mail_to: 'recipient@example.com',
      },
      smtp: {
        host: 'smtp.example.com',
        port: 587,
      },
      max_restarts: 5,
      check_interval_minutes: 10,
      processes: ['process1', 'process2'],
    };

    jest.clearAllMocks();
  });

  it('should create an instance of DataManager', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager).toBeInstanceOf(DataManager);
  });

  it('should return a list of processes if the config is valid', async () => {
    const dataManager = new DataManager(validConfig);
    const processes = await dataManager.getProcesses();

    expect(processes).toEqual([
      {name: 'process1', restarts: 0},
      {name: 'process2', restarts: 0},
    ]);
    expect(logger.info).toHaveBeenCalledWith(
      'Loaded 2 processes from the config file!'
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Processes to check: process1, process2'
    );
  });

  it('should log an error and exit if the config is invalid', async () => {
    validConfig.version = '';
    const dataManager = new DataManager(validConfig);

    await dataManager.getProcesses();

    expect(logger.error).toHaveBeenCalledWith(
      'Invalid or incomplete configuration!'
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('should validate the version correctly', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager['isValidVersion']('1.0.0')).toBe(true);
    expect(dataManager['isValidVersion']('')).toBe(false);
  });

  it('should validate the email config correctly', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager['isValidEmailConfig'](validConfig.email)).toBe(true);

    const invalidEmailConfig = {...validConfig.email, mail_from: ''};
    expect(dataManager['isValidEmailConfig'](invalidEmailConfig)).toBe(false);
  });

  it('should validate the smtp config correctly', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager['isValidSmtpConfig'](validConfig.smtp)).toBe(true);

    const invalidSmtpConfig = {...validConfig.smtp, host: ''};
    expect(dataManager['isValidSmtpConfig'](invalidSmtpConfig)).toBe(false);
  });

  it('should validate positive integers correctly', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager['isPositiveInteger'](1)).toBe(true);
    expect(dataManager['isPositiveInteger'](-1)).toBe(false);
    expect(dataManager['isPositiveInteger']('string')).toBe(false);
  });

  it('should validate the processes config correctly', () => {
    const dataManager = new DataManager(validConfig);
    expect(dataManager['isValidProcesses'](['process1', 'process2'])).toBe(
      true
    );
    expect(dataManager['isValidProcesses']([])).toBe(false);
  });
});
