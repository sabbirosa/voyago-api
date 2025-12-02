import http from "http";
import app from "./app";
import { config } from "./app/config/env";

const server = http.createServer(app);

const PORT = config.port;

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Voyago API listening on port ${PORT}`);
});
