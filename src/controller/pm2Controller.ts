import MailController from '../controller/mailController';
import DataManager from '../manager/dataManager';
import ExitHandler from '../handler/ExitHandler';
import config from '../../config/default.json';
import IShutdown from '../../interfaces/IShutdown';
import pm2, {ProcessDescription} from 'pm2';
import PM2Process from '../../types/PM2';
import logger from '../utilities/Logger';

export default class PM2Controller implements IShutdown {
  private readonly _mailController: MailController;
  private readonly _dataManager: DataManager;
  private intervalId: NodeJS.Timeout | null;

  constructor(dataManager: DataManager, mailController: MailController) {
    this._mailController = mailController;
    this._dataManager = dataManager;
    this.intervalId = null;

    logger.info(`PM2 Monitor started! Version ${config.version}`);
    ExitHandler.registerProcessToClose(this);
    this.connect();
  }

  public async gracefulShutdown(): Promise<void> {
    if (this.intervalId !== null) {
      this.intervalId = null;
    }
  }

  public async checkServices(): Promise<void> {
    if (this.intervalId === null) {
      const processes: PM2Process[] = await this._dataManager.getProcesses();
      logger.info(
        `Checking processes every ${config.check_interval_minutes} minute(s)`
      );

      this.intervalId = setInterval(
        async () => {
          for (const pm2Process of processes) {
            await this.checkProcess(pm2Process);
          }
        },
        config.check_interval_minutes * 60 * 1000
      );
    } else {
      logger.warn('Interval already set for process checking.');
    }
  }

  private async checkProcess(pm2Process: PM2Process): Promise<void> {
    const name = pm2Process.name;
    logger.info(`Checking process with name '${name}'`);

    try {
      const data = await this.getDataFromPM2(name);
      const appRestarts: number | undefined = data?.[0]?.pm2_env?.restart_time;

      if (appRestarts !== undefined && appRestarts > config.max_restarts) {
        logger.info(
          `Process '${name}' has restarted ${appRestarts} times which is greater than the threshold. Sending mail!`
        );
        pm2Process.restarts = appRestarts;
        this._mailController.sendMail(pm2Process);
      } else {
        logger.info(
          `Process '${name}' has restarted ${
            typeof appRestarts === 'undefined' ? 'n/a' : appRestarts
          } times! No need to send a mail!`
        );
      }
    } catch (error) {
      const errObj = error as Error;
      logger.error(
        `Error while getting data for process '${name}'! ${errObj.message}`
      );
      ExitHandler.handleExit(1);
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
        ExitHandler.handleExit(1);
      }
    });
  }
}
