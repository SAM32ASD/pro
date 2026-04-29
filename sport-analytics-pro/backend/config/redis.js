const redis = require('redis');

const noopClient = {
  connected: false,
  get: async () => null,
  set: async () => true,
  setEx: async () => true,
  del: async () => 0,
  incr: async () => 1,
  expire: async () => true,
  keys: async () => [],
  info: async () => '',
  quit: async () => {},
  on: () => {},
};

let client = noopClient;

if (process.env.REDIS_URL) {
  const realClient = redis.createClient({ url: process.env.REDIS_URL });

  realClient.on('error', (err) => {
    console.warn('Redis indisponible, fallback noop:', err.message);
  });

  realClient.connect().then(() => {
    console.log('Redis connecte');
    client = realClient;
  }).catch((err) => {
    console.warn('Redis connect echec, fallback noop:', err.message);
  });
} else {
  console.log('REDIS_URL absent, Redis desactive (noop)');
}

module.exports = new Proxy({}, {
  get: (_, prop) => {
    const target = client && client[prop] !== undefined ? client : noopClient;
    const value = target[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  }
});
