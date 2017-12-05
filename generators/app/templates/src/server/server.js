import express from 'express';
import compression from 'compression';
import zlib from 'zlib';
import chalk from 'chalk';
import indexTemplate from './templates/index';

const compressor = compression({
  flush: zlib.Z_PARTIAL_FLUSH,
});

export default class Server {
  constructor(port) {
    this._port = port;
    this._app = express();
    this._app.use(compressor);
    this._app.use('/css', express.static('../client/css'));
    this._app.use('/js', express.static('../client/js'));

    this._app.get('/', (req, res) => {
      res.send(indexTemplate({
        content: `<div class = 'page-wrapper'>
          <div class='welcome-message'>
            <div>Hello World!</div>
          </div>
        </div>`,
        scripts: '<script src="js/index_bundle.js" defer></script>',
      }));
    });
  }

  log(message) {
    console.log(chalk.bgBlue.bold('[Server]') + message);
  }

  listen() {
    this._app.listen(this._port, () => {
      this.log(`🌎  server started at port ${this._port}`);
    });
  }
}
