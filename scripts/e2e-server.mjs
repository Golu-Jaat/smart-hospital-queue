import { createServer } from "node:http";
import next from "next";

const hostname = "127.0.0.1";
const port = 3100;
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  void handle(request, response);
});

server.listen(port, hostname, () => {
  console.log(`E2E server ready at http://${hostname}:${port}`);
});

function shutdown() {
  server.closeAllConnections();
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
