const globalTeardown = async () => {
  await global.__MONGO_SERVER__.stop();
};

export default globalTeardown;
