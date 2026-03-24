class ResultsCache {
  constructor() {
    this.cache = new Map(); // pollId -> { results, total, lastAccessed }
    this.refreshInterval = null;
    this.redis = null;
    this.CACHE_REFRESH_INTERVAL = 2000;
    this.CACHE_EVICTION_TIME = 300000; // 5 minutes of inactivity
  }

  init(redis) {
    this.redis = redis;
    this.startRefreshInterval();
  }

  startRefreshInterval() {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(async () => {
      await this.refreshAllCached();
    }, this.CACHE_REFRESH_INTERVAL);
  }

  async refreshAllCached() {
    const now = Date.now();
    const pollsToRemove = [];

    for (const [pollId, cached] of this.cache.entries()) {
      // Remove polls that haven't been accessed recently
      if (now - cached.lastAccessed > this.CACHE_EVICTION_TIME) {
        pollsToRemove.push(pollId);
        continue;
      }

      // Refresh active polls
      await this.fetchAndCache(pollId, false);
    }

    // Evict inactive polls
    for (const pollId of pollsToRemove) {
      this.cache.delete(pollId);
    }
  }

  async fetchAndCache(pollId, updateAccessTime = true) {
    try {
      const raw = await this.redis.hGetAll(`poll:${pollId}:results`);

      const results = {};
      let total = 0;

      if (raw && Object.keys(raw).length > 0) {
        for (const [k, v] of Object.entries(raw)) {
          const count = parseInt(v);
          results[parseInt(k)] = count;
          total += count;
        }
      }

      const cached = this.cache.get(pollId) || {};
      this.cache.set(pollId, {
        results,
        total,
        lastAccessed: updateAccessTime ? Date.now() : (cached.lastAccessed || Date.now())
      });

      return { results, total };
    } catch (error) {
      console.error(`Error fetching results for poll ${pollId}:`, error);
      return null;
    }
  }

  get(pollId) {
    const cached = this.cache.get(pollId);

    if (cached) {
      // Update last accessed time
      cached.lastAccessed = Date.now();
      return { results: cached.results, total: cached.total };
    }

    // Cache miss - mark as accessed so it gets picked up in next refresh interval
    this.cache.set(pollId, {
      results: {},
      total: 0,
      lastAccessed: Date.now()
    });

    return { results: {}, total: 0 };
  }

  invalidate(pollId) {
    this.cache.delete(pollId);
  }

  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

module.exports = new ResultsCache();
