const { port } = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

async function start() {
  await connectDB();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${port}`);
  });
}

start();
