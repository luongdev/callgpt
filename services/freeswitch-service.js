const { FreeSwitchServer } = require('esl');

global.sockets = {};

const nilLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
};

const isOk = (res) => {
  const rep = res?.body?.['Reply-Text'];

  return rep && !rep.contains('-ERR');
};

const recorder = async (sk, uuid) => {
  const paths = await new Promise(async (resolve, reject) => {
    const delm = ';';
    const app = 'multiset';
    const args = [
      'record_stereo=true',
      'record_append=true',
      'record_path=$${recordings_dir}',
      'record_name=${strftime(%Y/%m/%d/%H)}/${uuid}.wav',
    ];

    const timeout = setTimeout(() => reject('Timeout'), 3000);
    sk.on('CHANNEL_EXECUTE_COMPLETE', async (event) => {
      const paths = { root: '', path: '' };
      if (app === event.body['Application'] && event.body['Application-Data']?.length) {
        const data = event.body['Application-Data'].split(delm);
        const recordPath = data.find((d) => d.indexOf('record_path=') === 0);
        const recordName = data.find((d) => d.indexOf('record_name=') === 0);

        if (recordPath) paths.root = recordPath.split('=')[1];
        if (recordName) paths.path = recordName.split('=')[1];

        if (paths.root?.length && paths.path?.length) {
          const recRes = await sk.api(`uuid_record ${uuid} start ${paths.root}/${paths.path}`);
          console.log(recRes);
        }
      }

      clearTimeout(timeout);
      resolve(paths);
    });


    const res = await sk.execute_uuid(uuid, app, args.join(delm));
    console.log(res);
  });

  console.log(paths);
};

const createFsServer = async () => {
  const server = new FreeSwitchServer({ my_events: true, logger: nilLogger });

  server.on('connection', async (socket, { data, uuid}) => {
    global['sockets'][uuid] = socket;

    await recorder(socket, uuid);
    await socket.execute('answer', '');
    const sample = 8000;
    const aResult = await socket.api(
      `uuid_audio_fork ${uuid} start ws://callgpt:3001/connection mono ${sample} botbug ${uuid} true true ${sample}`
    );

    console.log('aResult', aResult);



    socket.on('socket.close', () => {
      delete global['sockets'][uuid];
      console.log('Socket closed');
    });
  });


  server.listen({ host: '0.0.0.0', port: 65022 })
    .then(() => console.log('Listening on 65022'))
    .catch(console.error);



  // if (opts['onConnection'] && typeof opts['onConnection'] === 'function') {
  //   server.on('connection::open', opts['onConnection']);
  // }
  //
  // if (opts['onReady'] && typeof opts['onReady'] === 'function') {
  //   server.on('ready', opts['onReady']);
  // }
  //
  // if (opts['onClose'] && typeof opts['onClose'] === 'function') {
  //   server.on('close', opts['onClose']);
  // }
  //
  // if (opts['onError'] && typeof opts['onError'] === 'function') {
  //   server.on('error', opts['onError']);
  // }

  return server;
};

const hangup = async (id, cause) => {
  const socket = global?.['sockets']?.[id];
  if (!socket) {
    console.error('No call found with id: ', id);
    return false;
  }

  return isOk(await socket.execute('hangup', cause ?? 'NORMAL_CLEARING'));
};

const transfer = async (id, extension) => {
  const socket = global?.['sockets']?.[id];
  if (!socket) {
    console.error('No call found with id: ', id);
    return false;
  }

  if (!extension) {
    console.error('No extension provided');
    return false;
  }

  return isOk(await socket.execute('bridge', '${sofia_contact(*/' + extension + ')}'));
};


module.exports = {
  createFsServer,
  hangup,
  transfer,
};
