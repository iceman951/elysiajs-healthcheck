declare module "bun" {
  interface Env {
    MAIL_SERVER_HOST: string;
    MAIL_SERVER_PORT: number;
    SENDER_EMAIL: string; // sender's email
    SENDER_EMAIL_PWD: string; // sender's password
    RECEPTIAN_EMAIL: string; // recipient's email
  }
}