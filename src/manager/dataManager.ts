import type PM2Process from '../../types/PM2';
import type Config from '../../types/Config';
import logger from '../utilities/Logger';

export default class DataManager {
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async getProcesses(): Promise<PM2Process[]> {
    if (!this.isConfigValid()) {
      throw new Error('Invalid or incomplete configuration!');
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

    return !!(
      version &&
      email &&
      email.mail_from &&
      email.mail_from_password &&
      email.mail_to &&
      smtp &&
      smtp.host &&
      smtp.port &&
      max_restarts &&
      check_interval_minutes &&
      processes &&
      processes.length > 0
    );
  }
}
