import { createApp } from "./app.js";
import { config } from './config.js'

const port = Number(config.port);
createApp().listen(port, () => {
  console.log(`Le Récif API sur http://localhost:${port}`);
});
