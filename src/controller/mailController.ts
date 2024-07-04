import {smtp, email, max_restarts} from '../../config/default.json';
import ExitHandler from '../handler/ExitHandler';
import type PM2Process from '../../types/PM2';
import IShutdown from '../../interfaces/IShutdown';
import {createTransport, Transporter} from 'nodemailer';
import logger from '../utilities/Logger';
import fs from 'fs/promises';
import {join} from 'path';

/**
 * MailController class responsible for sending status emails for PM2 processes.
 */
export default class MailController implements IShutdown {
  private readonly _mailTransporter: Transporter;

  constructor() {
    this._mailTransporter = this.initTransporter();
    ExitHandler.registerProcessToClose(this);
  }

  /**
   * Gracefully shuts down the mail transporter.
   */
  public async gracefulShutdown(): Promise<void> {
    if (this._mailTransporter) {
      this._mailTransporter.close();
    }
  }

  /**
   * Sends an email with the status of the given processes.
   *
   * @param processes - An array of PM2Process objects to include in the email.
   */
  public async sendMail(processes: PM2Process[]): Promise<void> {
    try {
      const htmlTemplate = await this.readHTMLTemplate();
      const replacedHtml = this.populateTemplate(htmlTemplate, processes);
      const mailOptions = this.createMailOptions(replacedHtml);

      const info = await this._mailTransporter.sendMail(mailOptions);
      logger.info(
        `Status mail for processes has been sent! Response: ${info.response}`
      );
    } catch (error) {
      this.handleError(error, 'Error while sending status mail!');
    }
  }

  /**
   * Initializes the mail transporter with SMTP configuration.
   *
   * @returns The configured nodemailer transporter.
   */
  private initTransporter(): Transporter {
    return createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: {
        user: email.mail_from,
        pass: email.mail_from_password,
      },
    });
  }

  /**
   * Reads the HTML email template from file.
   *
   * @returns The HTML template as a string.
   */
  private async readHTMLTemplate(): Promise<string> {
    try {
      const filePath = join(__dirname, '../templates/status.html');
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      this.handleError(error, 'Error reading HTML template file!');
    }
  }

  /**
   * Populates the HTML template with process data.
   *
   * @param template - The HTML template as a string.
   * @param processes - An array of PM2Process objects to include in the template.
   * @returns The populated HTML template.
   */
  private populateTemplate(template: string, processes: PM2Process[]): string {
    const tableRows = processes
      .map(
        process => `
      <tr>
        <td>${process.name}</td>
        <td>${process.restarts ?? 'n/a'}</td>
        <td>${max_restarts.toString()}</td>
      </tr>
    `
      )
      .join('');

    return template.replace('{{tableRows}}', tableRows);
  }

  /**
   * Creates the mail options object for nodemailer.
   *
   * @param htmlContent - The HTML content of the email.
   * @returns The mail options object.
   */
  private createMailOptions(htmlContent: string) {
    return {
      from: email.mail_from,
      to: email.mail_to,
      subject: 'Exceeded Threshold for Processes',
      html: htmlContent,
    };
  }

  /**
   * Handles errors by logging them and rethrowing.
   *
   * @param error - The error object.
   * @param message - A custom error message to log.
   * @throws The original error after logging.
   */
  private handleError(error: unknown, message: string): never {
    const err = error as Error;
    logger.error(`${message} ${err.message}`);
    throw err;
  }
}
