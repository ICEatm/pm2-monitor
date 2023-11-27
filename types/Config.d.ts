export default interface Config {
  version: string;
  email: {
    mail_from: string;
    mail_from_password: string;
    mail_to: string;
  };
  smtp: {
    host: string;
    port: number;
  };
  max_restarts: number;
  check_interval_minutes: number;
  processes: string[];
}
