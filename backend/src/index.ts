import "dotenv/config";
import app from "./app.js";
import { logger } from "./lib/logger.js";

const port = parseInt(process.env["PORT"] ?? "3001", 10);

if (isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env["PORT"]}"`);
}

app.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});