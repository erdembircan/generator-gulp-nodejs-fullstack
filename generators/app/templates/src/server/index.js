import Server from './server';
import minimist from 'minimist';
import settings from './settings';

const argv = minimist(process.argv, {
  default: {
    'server-port': settings['server-port'],
  },
});

const server = new Server(argv['server-port']);

server.listen();
