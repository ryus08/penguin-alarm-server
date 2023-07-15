// Poor man's cache. Asssumes all parameters are from the URI, no cache control headers, no expiry
const cache = {};
module.exports = class OutboundCache {
  constructor({ name, defaultMaxAgeInSeconds, caches, user }, logger) {
    this.name = name;
    this.defaultMaxAgeInSeconds = defaultMaxAgeInSeconds;
    this.caches = caches;
    this.logger = logger;
    this.user = user;
  }

  async get(options, retrieve) {
    const cacheKey = this._cacheKey(options);
    const cacheEntry = cache[cacheKey];
    if (!cacheEntry || cacheEntry.expiresAt < Date.now()) {
      cache[cacheKey] = {
        result: await retrieve(options),
        expiresAt: Date.now() + this.defaultMaxAgeInSeconds * 1000
      };
    }

    return cache[cacheKey].result;
  }

  _cacheKey(options) {
    let prefix = this.name;
    if (this.user) {
      prefix = `${this.user}|${prefix}`;
    }
    return `${prefix}|${options.method}|${options.uri}`;
  }
};
