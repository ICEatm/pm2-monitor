/* eslint-disable no-process-exit */
import IShutdown from '../../interfaces/IShutdown';

/**
 * Class to handle graceful shutdown of processes.
 */
export default class ExitHandler {
  private static processesToClose: IShutdown[] = [];

  /**
   * Registers a process that needs to be gracefully shut down on exit.
   *
   * @param process - The process to register for graceful shutdown.
   */
  public static registerProcessToClose(process: IShutdown): void {
    this.processesToClose.push(process);
  }

  /**
   * Handles the application exit by gracefully shutting down all registered processes.
   *
   * @param exitCode - The exit code to use when exiting the process.
   */
  public static async handleExit(exitCode: number): Promise<void> {
    for (const process of this.processesToClose) {
      if (process && typeof process.gracefulShutdown === 'function') {
        await process.gracefulShutdown();
      }
    }

    process.exitCode = exitCode;
    process.exit();
  }
}
