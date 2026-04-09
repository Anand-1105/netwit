import { MailtrapClient } from "mailtrap"

const TOKEN = process.env.MAILTRAP_TOKEN;
const ENDPOINT = "https://send.api.mailtrap.io/"

export const client = new MailtrapClient({
  token: TOKEN,
  endpoint:ENDPOINT
});

export const sender = {
  email: "hello@grantshub.ca",
  name: "Meeting Booking",
};
  