import MailController from '../controller/mailController';
import IShutdown from '../../interfaces/IShutdown';
import ErrorHandler from '../handler/ErrorHandler';
import DataManager from '../manager/dataManager';
import ExitHandler from '../handler/ExitHandler';
import config from '../../config/default.json';
import pm2, {ProcessDescription} from 'pm2';
import PM2Process from '../../types/PM2';
import logger from '../utilities/Logger';
import schedule from 'node-schedule';

export default class PM2Controller implements IShutdown {
  private _processesExceedingThreshold: PM2Process[] = [];
  private readonly _mailController: MailController;
  private _processJob: schedule.Job | null = null;
  private readonly _errorHandler: ErrorHandler;
  private readonly _dataManager: DataManager;

  constructor(
    dataManager: DataManager,
    mailController: MailController,
    errorHandler: ErrorHandler
  ) {
    this._mailController = mailController;
    this._errorHandler = errorHandler;
    this._dataManager = dataManager;

    logger.info(`PM2 Monitor started! Version ${config.version}`);
    ExitHandler.registerProcessToClose(this);
    this._errorHandler.registerHandlers();
    this.connect();
  }

  public async gracefulShutdown(): Promise<void> {
    if (this._processJob !== null) {
      this._processJob.cancel();
    }
  }

  private async scheduleJob(): Promise<schedule.Job> {
    const processes: PM2Process[] = await this._dataManager.getProcesses();
    const intervalInMinutes = config.check_interval_minutes;
    logger.info(
      `Scheduling job to check processes every ${intervalInMinutes} minutes`
    );

    return schedule.scheduleJob(`*/${intervalInMinutes} * * * *`, async () => {
      try {
        this._processesExceedingThreshold = [];

        for (const pm2Process of processes) {
          await this.checkProcess(pm2Process);
        }

        if (this._processesExceedingThreshold.length > 0) {
          logger.info(
            `${
              this._processesExceedingThreshold.length > 1
                ? 'Multiple processes'
                : 'Only one process'
            } exceed${
              this._processesExceedingThreshold.length > 1 ? '' : 's'
            } the threshold. Sending ${
              this._processesExceedingThreshold.length > 1
                ? 'collective mail!'
                : 'individual mail!'
            }`
          );
          await this._mailController.sendMail(
            this._processesExceedingThreshold
          );
        } else {
          logger.info('No processes exceeded the threshold. No mail sent.');
        }
      } catch (error) {
        logger.error(`Error in scheduled job: ${error}`);
      }
    });
  }

  private async checkProcess(pm2Process: PM2Process): Promise<void> {
    const name = pm2Process.name;
    logger.info(`Checking process with name '${name}'`);

    try {
      const data = await this.getDataFromPM2(name);
      const appRestarts: number | undefined = data?.[0]?.pm2_env?.restart_time;

      if (appRestarts !== undefined && appRestarts > config.max_restarts) {
        logger.info(
          `Process '${name}' has restarted ${appRestarts} times which is greater than the threshold.`
        );
        pm2Process.restarts = appRestarts;
        this._processesExceedingThreshold.push(pm2Process);
      } else {
        logger.info(
          `Process '${name}' has restarted ${
            typeof appRestarts === 'undefined' ? 'n/a' : appRestarts
          } times! No need to include in the notification.`
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
    pm2.connect(async error => {
      if (error) {
        const e = error as Error;
        logger.error(`Error while connecting to pm2! ${e.message}`);
        ExitHandler.handleExit(1);
      }

      this._processJob = await this.scheduleJob();
    });
  }
}
