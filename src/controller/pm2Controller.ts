import MailController from '../controller/mailController';
import IShutdown from '../../interfaces/IShutdown';
import ErrorHandler from '../handler/ErrorHandler';
import DataManager from '../manager/dataManager';
import ExitHandler from '../handler/ExitHandler';
import config from '../../config/default.json';
import pm2, {ProcessDescription} from 'pm2';
import schedule, {Job} from 'node-schedule';
import PM2Process from '../../types/PM2';
import logger from '../utilities/Logger';

/**
 * PM2Controller manages the PM2 processes, checks for restart thresholds,
 * and sends notification emails when thresholds are exceeded.
 */
export default class PM2Controller implements IShutdown {
  private _processesExceedingThreshold: PM2Process[] = [];
  private readonly _mailController: MailController;
  private _processJob: Job | null = null;
  private readonly _errorHandler: ErrorHandler;
  private readonly _dataManager: DataManager;

  /**
   * Creates an instance of PM2Controller.
   *
   * @param dataManager - Instance of DataManager to manage process data.
   * @param mailController - Instance of MailController to send emails.
   * @param errorHandler - Instance of ErrorHandler to handle errors.
   */
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
  }

  /**
   * Gracefully shuts down the PM2Controller, cancelling any scheduled jobs.
   *
   * @returns A promise that resolves when the shutdown is complete.
   */
  public async gracefulShutdown(): Promise<void> {
    if (this._processJob !== null) {
      this._processJob.cancel();
    }
  }

  /**
   * Connects to PM2 and schedules the job for checking processes.
   */
  public connect(): void {
    pm2.connect(async error => {
      if (error) {
        this.handleError(error, 'Error while connecting to PM2!');
        ExitHandler.handleExit(1);
      }
      this._processJob = await this.scheduleJob();
    });
  }

  /**
   * Schedules the job to check processes at regular intervals.
   *
   * @returns A promise that resolves to a Job object.
   */
  private async scheduleJob(): Promise<Job> {
    const processes = await this._dataManager.getProcesses();
    const intervalInMinutes = config.check_interval_minutes;
    logger.info(
      `Scheduling job to check processes every ${intervalInMinutes} minutes`
    );

    return schedule.scheduleJob(`*/${intervalInMinutes} * * * *`, async () => {
      await this.checkAllProcesses(processes);
    });
  }

  /**
   * Checks all processes and handles those that exceed the restart threshold.
   *
   * @param processes - The list of PM2 processes to check.
   */
  private async checkAllProcesses(processes: PM2Process[]): Promise<void> {
    try {
      this._processesExceedingThreshold = [];
      for (const pm2Process of processes) {
        await this.checkProcess(pm2Process);
      }
      await this.handleExceededProcesses();
    } catch (error) {
      this.handleError(error, 'Error in scheduled job');
    }
  }

  /**
   * Checks a single process to see if it exceeds the restart threshold.
   *
   * @param pm2Process - The PM2 process to check.
   */
  private async checkProcess(pm2Process: PM2Process): Promise<void> {
    const name = pm2Process.name;
    logger.info(`Checking process with name '${name}'`);

    try {
      const data = await this.getDataFromPM2(name);
      const appRestarts = data?.[0]?.pm2_env?.restart_time;

      if (this.shouldNotify(appRestarts)) {
        logger.info(
          `Process '${name}' has restarted ${appRestarts} times which is greater than the threshold.`
        );
        pm2Process.restarts = appRestarts;
        this._processesExceedingThreshold.push(pm2Process);
      } else {
        logger.info(
          `Process '${name}' has restarted ${
            appRestarts ?? 'n/a'
          } times. No notification needed.`
        );
      }
    } catch (error) {
      this.handleError(error, `Error while getting data for process '${name}'`);
      ExitHandler.handleExit(1);
    }
  }

  /**
   * Determines if a process restart count exceeds the threshold and needs notification.
   *
   * @param appRestarts - The number of times the process has restarted.
   * @returns True if the process exceeds the restart threshold, false otherwise.
   */
  private shouldNotify(appRestarts: number | undefined): boolean {
    return appRestarts !== undefined && appRestarts > config.max_restarts;
  }

  /**
   * Handles processes that exceed the restart threshold by sending notifications.
   */
  private async handleExceededProcesses(): Promise<void> {
    if (this._processesExceedingThreshold.length > 0) {
      const msg = `${
        this._processesExceedingThreshold.length > 1
          ? 'Multiple processes'
          : 'Only one process'
      } exceed${
        this._processesExceedingThreshold.length > 1 ? '' : 's'
      } the threshold. Sending ${
        this._processesExceedingThreshold.length > 1
          ? 'collective mail!'
          : 'individual mail!'
      }`;
      logger.info(msg);
      await this._mailController.sendMail(this._processesExceedingThreshold);
    } else {
      logger.info('No processes exceeded the threshold. No mail sent.');
    }
  }

  /**
   * Fetches data from PM2 for a given process name.
   *
   * @param name - The name of the process to fetch data for.
   * @returns A promise that resolves to an array of ProcessDescription.
   */
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

  /**
   * Handles errors by logging them with a custom message.
   *
   * @param error - The error to handle.
   * @param message - The custom message to log with the error.
   */
  private handleError(error: unknown, message: string): void {
    const err = error as Error;
    logger.error(`${message} ${err.message}`);
  }
}
