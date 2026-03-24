class ResultsCache {
  constructor() {
    this.cache = new Map(); // pollId -> { results, total }
    this.refreshInterval = null;
    this.redis = null;
    this.CACHE_REFRESH_INTERVAL = 2000;
    this.pollIds = []; // Predefined list of poll IDs to cache
  }

  init(redis) {
    this.redis = redis;
    this.startRefreshInterval();
  }

  setPollIds(pollIds) {
    this.pollIds = pollIds;
    console.log(`Cache configured for ${pollIds.length} poll(s): ${pollIds.join(', ')}`);
  }

  addPollId(pollId) {
    if (!this.pollIds.includes(pollId)) {
      this.pollIds.push(pollId);
      console.log(`Added poll ${pollId} to cache`);
    }
  }

  removePollId(pollId) {
    this.pollIds = this.pollIds.filter(id => id !== pollId);
    this.cache.delete(pollId);
    console.log(`Removed poll ${pollId} from cache`);
  }

  startRefreshInterval() {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(async () => {
      await this.refreshAllCached();
    }, this.CACHE_REFRESH_INTERVAL);
  }

  async refreshAllCached() {
    // Refresh only the predefined polls
    for (const pollId of this.pollIds) {
      await this.fetchAndCache(pollId);
    }
  }

  async fetchAndCache(pollId) {
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

      this.cache.set(pollId, {
        results,
        total
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
      return { results: cached.results, total: cached.total };
    }

    return { results: {}, total: 0 };
  }

  invalidate(pollId) {
    this.cache.delete(pollId);
  }

  clearAll() {
    this.cache.clear();
    console.log('Cache cleared');
  }

  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

module.exports = new ResultsCache();
