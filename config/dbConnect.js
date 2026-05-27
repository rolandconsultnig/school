require("dotenv").config({ override: true });

const prisma = require("../lib/prisma");
require("colors");

const dbConnect = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL connected! ".yellow.bold);
  } catch (err) {
    console.error(`Failed to connect database: ${err}`.red.bold);
    process.exit(1);
  }
};

module.exports = dbConnect;
