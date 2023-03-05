"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = require("nodemailer");
const node_process_1 = require("node:process");
const dotenv_1 = require("dotenv");
const pm2 = require("pm2");
(0, dotenv_1.config)();
/**
 * The main function that monitors the restart counter of ASF instances.
 */
function monitorASFInstances() {
    /**
     * The list of names of ASF instances.
     * @type {string[]}
     */
    const APP_NAMES = ['APP1', 'APP2'];
    /**
     * The maximum number of restarts allowed for an ASF instance.
     * @type {Number}
     */
    const MAX_RESTARTS = 3;
    /**
     * The Nodemailer transporter object for sending emails.
     * @type {Transporter}
     */
    const transporter = (0, nodemailer_1.createTransport)({
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
            (0, node_process_1.exit)(2);
        }
        console.log('PM2-Monitor started! The script now will check the restart counter of the ASF instances every 30 minutes!');
        // Iterate through each ASF instance
        setInterval(() => {
            APP_NAMES.forEach(app => {
                // Get data for the current ASF instance
                pm2.describe(app, (error, appData) => {
                    var _a;
                    if (error) {
                        console.error(`Error while getting data for '${app}'! ${error.message}`);
                        (0, node_process_1.exit)(2);
                    }
                    /**
                     * The number of restarts for the current ASF instance.
                     * @type {number | undefined}
                     */
                    const appRestarts = (_a = appData[0].pm2_env) === null || _a === void 0 ? void 0 : _a.restart_time;
                    if (appRestarts !== undefined && appRestarts >= MAX_RESTARTS) {
                        // Send an email if the restart count exceeds the maximum allowed limit
                        const mailOptions = {
                            from: `${process.env.MAIL_FROM}`,
                            to: `${process.env.MAIL_TO}`,
                            subject: `Service ${app} has restarted too many times!`,
                            text: `The Service '${app}' has restarted ${appRestarts} times which is greater than the current limit of ${MAX_RESTARTS}`,
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.error(`Error while sending mail! ${error.message}`);
                                (0, node_process_1.exit)(2);
                            }
                            console.log(`Status mail has been sent! ${info.response}`);
                        });
                    }
                    else {
                        console.log(`Service '${app}' has restarted ${appRestarts} times!`);
                    }
                });
            });
        }, 1850000); // Check restart count every 30 minutes
    });
}
monitorASFInstances();
//# sourceMappingURL=index.js.map