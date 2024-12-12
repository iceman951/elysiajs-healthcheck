import { Elysia } from "elysia"
import { cron, Patterns } from "@elysiajs/cron"
import nodemailer from "nodemailer";
import axios, { type AxiosError } from "axios";
import swagger from "@elysiajs/swagger";

const transporter = nodemailer.createTransport({
  pool: true,
  host: Bun.env.MAIL_SERVER_HOST,
  port: Bun.env.MAIL_SERVER_PORT,
  secure: false, // use TLS
  auth: {
    user: Bun.env.SENDER_EMAIL,
    pass: Bun.env.SENDER_EMAIL_PWD,
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

const axios_timeout = 10000;

const app = new Elysia()
  .use(swagger())
  .use(
    cron({
      name: "heartbeat",
      pattern: Patterns.EVERY_5_MINUTES,
      async run() {
        console.log("# ============================")
        console.log("# Cron start... at ", new Date().toLocaleString())

        const site_200_url = "https://google.com";
        const site_500_url = "https://httpstat.us/500";

        const sites: string[] = []

        await axios.get(site_200_url, { timeout: axios_timeout })
          .then(res => {
            console.log('site_200_url: ', res.status)
          })
          .catch((error: AxiosError) => {
            sites.push(site_200_url)
            console.log('site_200_url: ', error.response?.status)
          });

        await axios.get(site_500_url, { timeout: axios_timeout })
          .then(res => {
            console.log('site_500_url: ', res.status)
          })
          .catch((error: AxiosError) => {
            sites.push(site_500_url)
            console.log('site_500_url: ', error.response?.status)
          });

        if (sites.length > 0) {

          const mailOptions = {
            from: Bun.env.SENDER_EMAIL,
            to: Bun.env.RECEPTIAN_EMAIL,
            subject: 'Notify Unhealthy',
            html:
              `<!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 1em;
                            border: 1px solid #333; /* Added border to the entire table */
                        }
                        th, td {
                            padding: 8px;
                            text-align: left;
                            border: 1px solid #ddd; /* Added border to table cells */
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        a {
                            color: #1a73e8;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        .footer-text {
                            font-size: 0.9em;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <p>To Maintainer</p>
                        <p>PLease check your services:</p>
                          <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Site</th>
                                    <th>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sites.map((site, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${site}</td>
                                        <td><a href="${site}" target="_blank">Go to Site</a></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <p>Thank You</p>
                        <br>
                        <p class="footer-text">
                            * Health check Service every 5 minutes <br>
                            
                            <p>Service List</p>
                            <ul>
                              <li>https://google.com</li>
                              <li>https://httpstat.us/500</li>
                            </ul>

                            Powered by ElysiaJS <br>
                        </p>
                        <p>Cron Control Center:</p>
                        <ul>
                            <li><a href="http://localhost:8666/pause">Pause Cron</a></li>
                            <li><a href="http://localhost:8666/resume">Resume Cron</a></li>
                        </ul>
                        <p><a href="http://localhost:8666/swagger">API Documentation</a></p>
                    </div>
                </body>
                </html>
            `,
          };

          await transporter.sendMail({
            ...mailOptions
          }).then(() => {
            console.log("Email Sent to: ", Bun.env.RECEPTIAN_EMAIL)
          }).catch((err) => {
            console.log(err)
          })

        } else {
          console.log('All Service OK')
        }

        console.log("# Cron end...")
      }
    }
    ))
  .get("/pause", ({ store: { cron: { heartbeat } } }) => {
    heartbeat.pause()
    console.log("Pause heartbeat")
    return "Pause heartbeat"
  })
  .get("/resume", ({ store: { cron: { heartbeat } } }) => {
    heartbeat.resume()
    console.log("Resume heartbeat")
    return "Resume heartbeat"
  })
  .listen(8666)

console.log(`🦊 Elysia is running at on port ${app.server?.port}...`)