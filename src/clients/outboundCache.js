// Poor man's cache. Asssumes all parameters are from the URI, no cache control headers
module.exports = class OutboundCache {
  constructor({ name, defaultMaxAgeInSeconds, caches }, logger) {
    this.name = name;
    this.defaultMaxAgeInSeconds = defaultMaxAgeInSeconds;
    this.caches = caches;
    this.logger = logger;
    this.cache = {};
  }

  async get(options, retrieve) {
    const cacheKey = this._cacheKey(options);
    const cacheEntry = this.cache[cacheKey];
    if (!cacheEntry || cacheEntry.expiresAt < Date.now()) {
      this.cache[cacheKey] = {
        result: await retrieve(options),
        expiresAt: Date.now() + this.defaultMaxAgeInSeconds * 1000
      };
    }

    return this.cache[cacheKey].result;
  }

  _cacheKey(options) {
    return `${this.name}|${options.method}|${options.uri}`;
  }
};
