import pm2 from 'pm2';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import Tail from 'tail-file';
import type { NewGamePayload, NewGameRequest } from './types';

dotenv.config();

const {
  SECRET,
  MAX_PLAYERS,
  SERVER_DIR,
  SERVER_EXECUTEABLE,
  SERVER_PUBLIC_IP,
  INSTANCE_TIMEOUT_MS,
} = process.env;

if (SECRET === undefined || MAX_PLAYERS === undefined) {
  throw new Error(`SECRET or MAX_PLAYERS not set in gameserver .env file`);
}

if (SERVER_DIR === undefined || SERVER_EXECUTEABLE === undefined) {
  throw new Error(
    `SERVER_DIR or SERVER_EXECUTEABLE not set in gamesrver .env file`,
  );
}

if (SERVER_PUBLIC_IP === undefined) {
  throw new Error(`SERVER_PUBLIC_IP not set in gameserver .env file`);
}

if (INSTANCE_TIMEOUT_MS === undefined) {
  throw new Error(`INSTANCE_TIMEOUT_MS not set in gameserver .env file`);
}

const apiBearerToken = `Bearer ${SECRET}`;
const maxPlayers: number = parseInt(MAX_PLAYERS, 10);
const serverCwd: string = SERVER_DIR;
const serverExec: string = SERVER_EXECUTEABLE;
const serverAddress: string = SERVER_PUBLIC_IP;
const serverExecuteableFullPath = path.join(serverCwd, serverExec);

if (!fs.existsSync(serverCwd) || !fs.existsSync(serverExecuteableFullPath)) {
  throw new Error(
    `serverCwd ${serverCwd} or serverExec ${serverExecuteableFullPath} doesn't exist`,
  );
}

fs.accessSync(serverExecuteableFullPath, fs.constants.X_OK);

const instanceTimeoutMs = parseInt(INSTANCE_TIMEOUT_MS, 10);

console.log(
  `Starting game manager with server dir ${serverCwd}, executeable ${serverExec}, maxPlayers ${maxPlayers} and instance timeout ${instanceTimeoutMs}ms (${
    instanceTimeoutMs / 1000 / 60
  }m)`,
);

const MIN_PORT = 6000;
const MAX_PORT = 7000;

const getFreePort = (): Promise<number> =>
  new Promise((res, rej) => {
    pm2.list((err, list) => {
      console.log(list.map(p => ({ name: p.name, mem: p.monit?.memory })));
      const usedPorts = list
        .filter(p => p.monit?.memory) // filter out only active processes
        .map(p => p.name)
        .filter((n): n is string => n !== undefined)
        .map(p => parseInt(p, 10))
        .filter(n => !Number.isNaN(n));
      const availablePorts = [...Array(MAX_PORT - MIN_PORT).keys()]
        .map(i => i + MIN_PORT)
        .filter(port => usedPorts.indexOf(port) === -1);

      if (availablePorts.length === 0) {
        throw new Error(
          `no available ports, ${usedPorts.length}/${MAX_PORT - MIN_PORT} used`,
        );
      }
      res(availablePorts[Math.floor(Math.random() * availablePorts.length)]);
    });
  });

const PORT = 5000;
const app = express();

const getProcess = (processName: string) =>
  new Promise<pm2.ProcessDescription | undefined>(resolve => {
    pm2.list((err, procList) => {
      resolve(procList.find(p => p.name === processName));
    });
  });

const getProcUniqueId = (procReturnedFromPm2Command: any[]) =>
  procReturnedFromPm2Command[0].pm2_env.unique_id;

app.get('/', (req, res) => {
  res.send('Gameserver hello world!');
});
// auth middleware
app.use((req, res, next) => {
  if (req.headers.authorization !== apiBearerToken) {
    console.warn(
      `Request with incorrect auth token ${req.headers.authorization} at ${req.path}`,
    );
    res.status(401);
    res.json('Incorrect authorization token');
    return null;
  }
  return next();
});
app.use(bodyParser.json());

app.post('/newgame', async (req, res) => {
  const data: NewGameRequest = req.body;

  if (
    typeof data.gameID === 'string' &&
    data.gameID.length > 18 &&
    Array.isArray(data.players) &&
    data.players.length > 0 &&
    data.players.length < maxPlayers &&
    data.players.every(p => p.id && typeof p.id === 'string' && p.id.length > 0)
  ) {
    // TODO check if we have available memory

    const portNum = await getFreePort();
    // input should be safe
    const newGamePayload: NewGamePayload = {
      players: data.players.map((p, i) => ({
        id: p.id,
        accessToken: nanoid(),
        playerIndex: i,
        username: p.username,
      })),
      port: portNum,
      serverAddress,
    };

    const processName = portNum.toString();
    await new Promise<void>(resolve => {
      pm2.delete(processName, (err, proc) => {
        if (err) {
          if (!err.message.includes('not found')) {
            throw err;
          }
        } else {
          console.log(
            `deleting dead process ${processName} to make space on port`,
          );
        }
        resolve();
      });
    });
    const escapedArgs = `'${JSON.stringify(newGamePayload)}'`;
    console.log(
      `starting server inside ${serverCwd} arg ${serverExec} args ${escapedArgs}`,
    );

    const logfilePath = path.join(
      __dirname,
      '../logs',
      `${portNum}_${data.gameID}.log`,
    );
    // create log file
    fs.closeSync(fs.openSync(logfilePath, 'w'));
    const serverReadyQuote = 'NetworkManager.Start()';

    const waitForServerStartedPromise = new Promise<void>(resolve => {
      const logfileTail = new Tail(logfilePath, (line: string) => {
        if (line.includes(serverReadyQuote)) {
          console.log(`${data.gameID} got server ready quote`, line);
          logfileTail.stop();
          resolve();
        }
      });
    });

    pm2.start(
      {
        name: processName,
        cwd: serverCwd,
        script: serverExec,
        args: escapedArgs,
        // if we hit 200M just kill the server, don't try to restart
        max_restarts: 0,
        max_memory_restart: '200M', // TODO make this a .env variable,
        autorestart: false,
        output: logfilePath,
        time: true,
      },
      async (startErr, startedProc) => {
        if (startErr) {
          throw startErr;
        }
        const procUniqueId = getProcUniqueId(startedProc as any[]);

        setTimeout(async () => {
          // check process is the same
          const currentProcess = await getProcess(processName);
          const currentProcUniqueId = getProcUniqueId([currentProcess]);
          if (currentProcUniqueId === procUniqueId) {
            console.log(`killing ${processName} from timeout`);
            pm2.stop(processName, (stopErr, stoppedProc) => {
              if (stopErr) {
                if (!stopErr.message.includes('not found')) {
                  throw stopErr;
                } else {
                  console.log(`process ${processName} already cleaned up`);
                }
              }
            });
          }
        }, instanceTimeoutMs);

        // wait for the server to start + 500 ms for safety
        await waitForServerStartedPromise;
        setTimeout(() => {
          res.json(newGamePayload);
        }, 500);
      },
    );
  } else {
    res.status(400);
    res.send(`data.players was not a list or not of the correct form`);
  }
});

app.get('/games', (req, res) => {
  pm2.list((err, list) => {
    if (err) throw err;
    res.json(list);
  });
});

// app.get('game/:gameID', (req, res) => {});
pm2.connect(async err => {
  if (err) {
    console.error(err);
    process.exit(2);
  }
  app.listen(PORT, () => {
    console.log(`blob-game gameserver listening at http://localhost:${PORT}`);
  });
});
