/* eslint-disable no-process-exit */
import IShutdown from '../../interfaces/IShutdown';

export default class ExitHandler {
  static processesToClose: IShutdown[] = [];

  static registerProcessToClose(process: IShutdown): void {
    this.processesToClose.push(process);
  }

  static async handleExit(exitCode: number): Promise<void> {
    for (const process of this.processesToClose) {
      if (process && typeof process.gracefulShutdown === 'function') {
        await process.gracefulShutdown();
      }
    }

    process.exitCode = exitCode;
    process.exit();
  }
}
