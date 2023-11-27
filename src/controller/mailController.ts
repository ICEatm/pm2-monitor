import {createTransport, SentMessageInfo, Transporter} from 'nodemailer';
import {smtp, email, max_restarts} from '../../config/default.json';
import type MailOptions from '../../types/Mail';
import type PM2Process from '../../types/PM2';
import logger from '../utilities/Logger';

export default class MailController {
  private readonly _mailTransporter: Transporter;

  constructor() {
    this._mailTransporter = this.initTransporter();
  }

  public async sendMail(process: PM2Process): Promise<void> {
    const options: MailOptions = {
      from: email.mail_from,
      to: email.mail_to,
      subject: `Service ${process.name} has restarted too many times!`,
      text: `The service ${process.name} has restarted ${process.restarts} times!\nThe current max is ${max_restarts} restarts!`,
    };

    try {
      const info: SentMessageInfo =
        await this._mailTransporter.sendMail(options);
      logger.info(
        `Status mail for service ${process.name} has been sent! Response: ${info.response}`
      );
    } catch (error) {
      const e = error as Error;
      logger.error(`Error while sending status mail! ${e.message}`);
      throw e;
    }
  }

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
}
