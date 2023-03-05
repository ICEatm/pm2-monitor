import {createTransport, SentMessageInfo, Transporter} from 'nodemailer';
import {exit} from 'node:process';
import {config} from 'dotenv';
import * as pm2 from 'pm2';

config();

/**
 * The main function that monitors the restart counter of ASF instances.
 */
function monitorASFInstances() {
  /**
   * The list of names of ASF instances.
   * @type {string[]}
   */
  const APP_NAMES: string[] = ['APP1', 'APP2'];

  /**
   * The maximum number of restarts allowed for an ASF instance.
   * @type {Number}
   */
  const MAX_RESTARTS: Number = 3;

  /**
   * The Nodemailer transporter object for sending emails.
   * @type {Transporter}
   */
  const transporter: Transporter = createTransport({
    host: 'smtp.web.de',
    port: 587,
    auth: {
      user: `${process.env.MAIL_FROM}`,
      pass: `${process.env.MAIL_PASS}`,
    },
  });

  // Connect to pm2 service
  pm2.connect(error => {
    if (error) {
      console.error(`Error while connecting to pm2 service! ${error.message}`);
      exit(2);
    }

    console.log(
      'PM2-Monitor started! The script now will check the restart counter of the ASF instances every 30 minutes!'
    );

    // Iterate through each ASF instance
    setInterval(() => {
      APP_NAMES.forEach(app => {
        // Get data for the current ASF instance
        pm2.describe(app, (error, appData) => {
          if (error) {
            console.error(
              `Error while getting data for '${app}'! ${error.message}`
            );
            exit(2);
          }

          /**
           * The number of restarts for the current ASF instance.
           * @type {number | undefined}
           */
          const appRestarts: Number | undefined =
            appData[0].pm2_env?.restart_time;
          if (appRestarts !== undefined && appRestarts >= MAX_RESTARTS) {
            // Send an email if the restart count exceeds the maximum allowed limit
            const mailOptions = {
              from: `${process.env.MAIL_FROM}`,
              to: `${process.env.MAIL_TO}`,
              subject: `Service ${app} has restarted too many times!`,
              text: `The Service '${app}' has restarted ${appRestarts} times which is greater than the current limit of ${MAX_RESTARTS}`,
            };

            transporter.sendMail(
              mailOptions,
              (error, info: SentMessageInfo) => {
                if (error) {
                  console.error(`Error while sending mail! ${error.message}`);
                  exit(2);
                }

                console.log(`Status mail has been sent! ${info.response}`);
              }
            );
          } else {
            console.log(`Service '${app}' has restarted ${appRestarts} times!`);
          }
        });
      });
    }, 1850000); // Check restart count every 30 minutes
  });
}

monitorASFInstances();
