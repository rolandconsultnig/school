require("dotenv").config({ override: true });

const http = require("http");
const app = require("./app/app");
require("colors");
const dbConnect = require("./config/dbConnect");

const port = process.env.PORT || 3001;
const server = http.createServer(app);

dbConnect().then(() => {
  server.listen(port, () => {
    console.log(` server is running on port : ${port} `.black.bgGreen.bold);
  });
});
