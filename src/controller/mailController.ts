import {smtp, email, max_restarts} from '../../config/default.json';
import ExitHandler from '../handler/ExitHandler';
import type PM2Process from '../../types/PM2';
import IShutdown from '../../interfaces/IShutdown';
import {createTransport} from 'nodemailer';
import logger from '../utilities/Logger';
import fs from 'fs/promises';
import {join} from 'path';

export default class MailController implements IShutdown {
  private readonly _mailTransporter;

  constructor() {
    this._mailTransporter = this.initTransporter();
    ExitHandler.registerProcessToClose(this);
  }

  public async gracefulShutdown(): Promise<void> {
    if (this._mailTransporter !== null) {
      this._mailTransporter.close();
    }
  }

  public async sendMail(process: PM2Process) {
    const htmlTemplate = await this.readHTMLTemplate();

    const tableRow = `<tr>
      <td>${process.name}</td>
      <td>${process.restarts ?? 'n/a'}</td>
      <td>${max_restarts.toString()}</td>
    </tr>`;

    const replacedHtml = htmlTemplate.replace('{{tableRows}}', tableRow);

    const mailOptions = {
      from: email.mail_from,
      to: email.mail_to,
      subject: `Service ${process.name} has restarted too many times!`,
      html: replacedHtml,
    };

    try {
      const info = await this._mailTransporter.sendMail(mailOptions);
      logger.info(
        `Status mail for service ${process.name} has been sent! Response: ${info.response}`
      );
    } catch (error) {
      const e = error as Error;
      logger.error(`Error while sending status mail! ${e.message}`);
      throw e;
    }
  }

  private initTransporter() {
    return createTransport({
      host: smtp.host,
      port: smtp.port,
      auth: {
        user: email.mail_from,
        pass: email.mail_from_password,
      },
    });
  }

  private async readHTMLTemplate() {
    try {
      const htmlTemplate = await fs.readFile(
        join(__dirname, '../templates/status.html'),
        'utf-8'
      );
      return htmlTemplate;
    } catch (error) {
      const errObj = error as Error;
      logger.error(`Error reading HTML template file! ${errObj.message}`);
      throw error;
    }
  }
}
