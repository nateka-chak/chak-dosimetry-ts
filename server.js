const express = require("express");
const next = require("next");
const dotenv = require("dotenv");

dotenv.config();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = Number(process.env.PORT) || 4488;
const HOST = process.env.HOST || "0.0.0.0";

app.prepare().then(() => {
  const server = express();

  // ✅ just forward everything to Next.js
  server.all("*", (req, res) => handle(req, res));

  server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(
      `✅ Ready on http://${HOST}:${PORT}${process.env.BASE_PATH || ""}`
    );
  });
});
