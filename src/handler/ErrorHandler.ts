import logger from '../utilities/Logger';

/**
 * Class to handle uncaught exceptions and unhandled promise rejections.
 */
export default class ErrorHandler {
  /**
   * Registers the handlers for uncaught exceptions and unhandled promise rejections.
   */
  public registerHandlers(): void {
    process.on('uncaughtException', this.uncaughtExceptionHandler);
    process.on('unhandledRejection', this.unhandledRejectionHandler);
    logger.info('Successfully registered error handlers!');
  }

  /**
   * Handles uncaught exceptions by logging the error.
   *
   * @param error - The error object representing the uncaught exception.
   */
  private uncaughtExceptionHandler(error: Error): void {
    logger.error(`Uncaught Error occurred: ${error.stack || error.toString()}`);
  }

  /**
   * Handles unhandled promise rejections by logging the rejection reason and the promise.
   *
   * @param reason - The reason for the unhandled rejection.
   * @param promise - The promise that was rejected.
   */
  private unhandledRejectionHandler(
    reason: unknown,
    promise: Promise<any>
  ): void {
    logger.error(`Unhandled Rejection at ${promise}, Reason: ${reason}`);
  }
}
