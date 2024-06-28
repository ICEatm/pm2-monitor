import type PM2Process from '../../types/PM2';
import type Config from '../../types/Config';
import logger from '../utilities/Logger';
import {exit} from 'node:process';

export default class DataManager {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async getProcesses(): Promise<PM2Process[]> {
    if (!this.isConfigValid()) {
      logger.error('Invalid or incomplete configuration!');
      exit(1);
    }

    const processArray: PM2Process[] = [];

    this.config.processes.forEach(process => {
      processArray.push({name: process, restarts: 0});
    });

    const numProcesses = processArray.length;
    const processPlural = numProcesses > 1 ? 'es' : '';

    const processNames = processArray.map(process => process.name);
    const processesLog =
      numProcesses > 1 ? processNames.join(', ') : processNames[0];

    logger.info(
      `Loaded ${numProcesses} process${processPlural} from the config file!`
    );
    logger.info(`Processes to check: ${processesLog}`);

    return processArray;
  }

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

  private isValidVersion(version: any): boolean {
    return typeof version === 'string' && version.trim() !== '';
  }

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

  private isValidSmtpConfig(smtp: any): boolean {
    return (
      smtp &&
      typeof smtp.host === 'string' &&
      smtp.host.trim() !== '' &&
      typeof smtp.port === 'number' &&
      smtp.port > 0
    );
  }

  private isPositiveInteger(value: any): boolean {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }

  private isValidProcesses(processes: any): boolean {
    return Array.isArray(processes) && processes.length > 0;
  }
}
