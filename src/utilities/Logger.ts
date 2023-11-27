import winston, {transports} from 'winston';
import {join} from 'path';

class Logger {
  private readonly _combinedFileTransport: transports.FileTransportInstance;
  private readonly _consoleTransport: transports.ConsoleTransportInstance;
  private readonly _errorFileTransport: transports.FileTransportInstance;
  private readonly _logger: winston.Logger;

  constructor() {
    this._consoleTransport = this.initConsoleTransport();
    this._combinedFileTransport = this.initFileTransfer('COMBINED');
    this._errorFileTransport = this.initFileTransfer('ERROR');
    this._logger = this.initLogger();
  }

  public getLogger(): winston.Logger {
    return this._logger;
  }

  private initLogger(): winston.Logger {
    return winston.createLogger({
      level: 'info',
      transports: [
        this._consoleTransport,
        this._combinedFileTransport,
        this._errorFileTransport,
      ],
    });
  }

  private initConsoleTransport(): transports.ConsoleTransportInstance {
    return new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({level, message, timestamp}) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    });
  }

  private initFileTransfer(
    type: 'COMBINED' | 'ERROR'
  ): transports.FileTransportInstance {
    switch (type) {
      case 'COMBINED': {
        return new winston.transports.File({
          filename: join(__dirname, '../../logs/combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        });
      }
      case 'ERROR': {
        return new winston.transports.File({
          filename: join(__dirname, '../../logs/error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        });
      }
      default:
        throw new Error(
          `Invalid type of logfile provided! ${type} is not a valid type!`
        );
    }
  }
}

const newLogger = new Logger();
const logger: winston.Logger = newLogger.getLogger();

export default logger;
