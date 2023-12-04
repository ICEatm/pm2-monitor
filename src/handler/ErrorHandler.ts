import logger from '../utilities/Logger';

export default class ErrorHandler {
  public registerHandlers(): void {
    process.on('uncaughtException', this.uncaughtExceptionHandler);
    process.on('unhandledRejection', this.unhandledRejectionHandler);
    logger.info('Successfully registered error handlers!');
  }

  private uncaughtExceptionHandler(error: Error): void {
    logger.error(`Uncaught Error occured: ${error.stack || error.toString()}`);
  }

  private unhandledRejectionHandler(
    reason: string,
    promise: Promise<any>
  ): void {
    logger.error(`Unhandled Rejection at ${promise} , Reason: ${reason}`);
  }
}
