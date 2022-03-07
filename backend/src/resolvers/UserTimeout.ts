import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { User } from './AuthResolver';

export type UserTimeoutEventListenerHandler = (user: User) => void;
type UserTimeoutEvents = {
  heartbeat: UserTimeoutEventListenerHandler;
  timeout: UserTimeoutEventListenerHandler;
  clear: UserTimeoutEventListenerHandler;
};

export default function getUserTimeoutListener(timeoutMs: number) {
  console.log(`getUserTimeoutListener(${timeoutMs})`);
  const timeoutEventManager =
    new EventEmitter() as TypedEmitter<UserTimeoutEvents>;
  const timeoutDict: Record<string, ReturnType<typeof setTimeout>> = {
    // map of user ids to setTimeouts for emitting user timeout events
  };
  timeoutEventManager.on('heartbeat', (user: User) => {
    console.log(`user(${user.username}) heartbeat`);
    if (user.id in timeoutDict) {
      clearTimeout(timeoutDict[user.id]);
      delete timeoutDict[user.id];
    }
    timeoutDict[user.id] = setTimeout(
      () => timeoutEventManager.emit('timeout', user),
      timeoutMs,
    );
  });

  timeoutEventManager.addListener('timeout', (user: User) => {
    console.log(`user(${user.username}) timeout`);
  });

  timeoutEventManager.addListener('clear', (user: User) => {
    if (user.id in timeoutDict) {
      clearTimeout(timeoutDict[user.id]);
      delete timeoutDict[user.id];
    }
  });

  return timeoutEventManager;
}

// import timeoutEventManager
// emit 'heartbeat' events when we get a user heartbeat
// listen for 'timeout' event to time users out
// IDEA: have specific timeout event managers for different timeout types?
// IDEA: could wrap this in a factory function to create listeners whenever we want
