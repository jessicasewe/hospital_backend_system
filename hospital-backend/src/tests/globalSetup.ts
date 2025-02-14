import { MongoMemoryServer } from "mongodb-memory-server";

declare global {
  var __MONGO_URI__: string;
  var __MONGO_SERVER__: MongoMemoryServer;
}

const globalSetup = async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  global.__MONGO_URI__ = uri;
  global.__MONGO_SERVER__ = mongoServer;
};

export default globalSetup;
