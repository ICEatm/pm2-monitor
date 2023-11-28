import MailController from './controller/mailController';
import PM2Controller from './controller/pm2Controller';
import DataManager from './manager/dataManager';
import Config from '../config/default.json';

new PM2Controller(new DataManager(Config), new MailController());
