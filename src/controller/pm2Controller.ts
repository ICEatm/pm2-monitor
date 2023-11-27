import MailController from '../controller/mailController';
import DataManager from '../manager/dataManager';
import config from '../../config/default.json';
import pm2, { ProcessDescription } from 'pm2';
import PM2Process from '../../types/PM2';
import logger from '../utilities/Logger';
import { exit } from 'process';

export default class PM2Controller {
  private readonly _mailController: MailController;
  private readonly _dataManager: DataManager;
  private intervalId: NodeJS.Timeout | null;

  constructor() {
    this._mailController = new MailController();
    this._dataManager = new DataManager(config);
    this.intervalId = null;

    logger.info(`PM2 Monitor started! Version ${config.version}`);
    this.connect();
  }

  public async checkServices(): Promise<void> {
    if (this.intervalId === null) {
      const processes: PM2Process[] = await this._dataManager.getProcesses();
      logger.info(
        `Checking processes every ${config.check_interval_minutes} minute(s)`
      );

      this.intervalId = setInterval(
        async () => {
          for (const process of processes) {
            await this.checkProcess(process);
          }
        },
        config.check_interval_minutes * 60 * 1000
      );
    } else {
      logger.warn('Interval already set for process checking.');
    }
  }

  private async checkProcess(process: PM2Process): Promise<void> {
    const name = process.name;
    logger.info(`Checking process with name '${name}'`);

    try {
      const data = await this.getDataFromPM2(name);
      const appRestarts: number | undefined = data?.[0]?.pm2_env?.restart_time;

      if (appRestarts !== undefined && appRestarts >= config.max_restarts) {
        process.restarts = appRestarts;
        this._mailController.sendMail(process);
      } else {
        logger.info(
          `Process '${name}' has restarted ${appRestarts} times! No need to send a mail!`
        );
      }
    } catch (error) {
      const errObj = error as Error;
      logger.error(
        `Error while getting data for process '${name}'! ${errObj.message}`
      );
      exit(1);
    }
  }

  private getDataFromPM2(name: string): Promise<ProcessDescription[]> {
    return new Promise((resolve, reject) => {
      pm2.describe(name, (error, data) => {
        if (error) {
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  }

  private connect(): void {
    pm2.connect(error => {
      if (error) {
        const e = error as Error;
        logger.error(`Error while connecting to pm2! ${e.message}`);
        exit(1);
      }
    });
  }
}
