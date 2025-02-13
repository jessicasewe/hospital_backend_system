import app from "./app";
import { connectDb } from "./config/database";
import logger from "./config/logger";

const PORT = process.env.PORT;

//start server
async function startServer() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

startServer();
