import type PM2Process from '../../types/PM2';
import type Config from '../../types/Config';
import logger from '../utilities/Logger';
import {exit} from 'node:process';

/**
 * Class responsible for managing PM2 processes based on configuration.
 */
export default class DataManager {
  private readonly config: Config;

  /**
   * Creates an instance of DataManager.
   *
   * @param config - The configuration object.
   */
  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Retrieves the list of processes to monitor from the configuration.
   *
   * @returns A promise that resolves to an array of PM2Process objects.
   */
  public async getProcesses(): Promise<PM2Process[]> {
    if (!this.isConfigValid()) {
      logger.error('Invalid or incomplete configuration!');
      exit(1);
    }

    const processArray: PM2Process[] = this.config.processes.map(process => ({
      name: process,
      restarts: 0,
    }));

    this.logLoadedProcesses(processArray);
    return processArray;
  }

  /**
   * Checks if the configuration is valid.
   *
   * @returns A boolean indicating whether the configuration is valid.
   */
  private isConfigValid(): boolean {
    const {
      version,
      email,
      smtp,
      max_restarts,
      check_interval_minutes,
      processes,
    } = this.config;

    return (
      this.isValidVersion(version) &&
      this.isValidEmailConfig(email) &&
      this.isValidSmtpConfig(smtp) &&
      this.isPositiveInteger(max_restarts) &&
      this.isPositiveInteger(check_interval_minutes) &&
      this.isValidProcesses(processes)
    );
  }

  /**
   * Validates the version property of the configuration.
   *
   * @param version - The version to validate.
   * @returns A boolean indicating whether the version is valid.
   */
  private isValidVersion(version: any): boolean {
    return typeof version === 'string' && version.trim() !== '';
  }

  /**
   * Validates the email configuration.
   *
   * @param email - The email configuration to validate.
   * @returns A boolean indicating whether the email configuration is valid.
   */
  private isValidEmailConfig(email: any): boolean {
    return (
      email &&
      typeof email.mail_from === 'string' &&
      email.mail_from.trim() !== '' &&
      typeof email.mail_from_password === 'string' &&
      email.mail_from_password.trim() !== '' &&
      typeof email.mail_to === 'string' &&
      email.mail_to.trim() !== ''
    );
  }

  /**
   * Validates the SMTP configuration.
   *
   * @param smtp - The SMTP configuration to validate.
   * @returns A boolean indicating whether the SMTP configuration is valid.
   */
  private isValidSmtpConfig(smtp: any): boolean {
    return (
      smtp &&
      typeof smtp.host === 'string' &&
      smtp.host.trim() !== '' &&
      typeof smtp.port === 'number' &&
      smtp.port > 0
    );
  }

  /**
   * Validates if a value is a positive integer.
   *
   * @param value - The value to validate.
   * @returns A boolean indicating whether the value is a positive integer.
   */
  private isPositiveInteger(value: any): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  /**
   * Validates the processes configuration.
   *
   * @param processes - The processes configuration to validate.
   * @returns A boolean indicating whether the processes configuration is valid.
   */
  private isValidProcesses(processes: any): boolean {
    return Array.isArray(processes) && processes.length > 0;
  }

  /**
   * Logs the processes that were loaded from the configuration.
   *
   * @param processArray - The array of PM2Process objects.
   */
  private logLoadedProcesses(processArray: PM2Process[]): void {
    const numProcesses = processArray.length;
    const processPlural = numProcesses > 1 ? 'es' : '';

    const processNames = processArray.map(process => process.name);
    const processesLog =
      numProcesses > 1 ? processNames.join(', ') : processNames[0];

    logger.info(
      `Loaded ${numProcesses} process${processPlural} from the config file!`
    );
    logger.info(`Processes to check: ${processesLog}`);
  }
}
