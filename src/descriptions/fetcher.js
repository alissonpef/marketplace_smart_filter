(function (root) {
  'use strict';

  const parser =
    typeof module === 'object' && module.exports
      ? require('./parser.js')
      : root.MKF.DescriptionParser;

  const REQUEST_OPTIONS = Object.freeze({
    credentials: 'include',
    headers: { Accept: 'text/html' }
  });
  const BLOCKED_PATH = /^\/(login|checkpoint)/;
  const DEFAULT_DELAY_RANGE_MS = [800, 1600];
  const DEFAULT_MAX_PER_SESSION = 120;
  const DEFAULT_PAUSE_MS = 10 * 60 * 1000;

  const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const randomBetween = (min, max) => min + Math.random() * (max - min);

  function pathnameOf(url) {
    try {
      return new URL(url).pathname;
    } catch (_) {
      return '';
    }
  }

  function isBlocked(response) {
    return !response.ok || response.status === 429 || BLOCKED_PATH.test(pathnameOf(response.url));
  }

  function create({
    fetchFn,
    onResult,
    onChange = () => {},
    delayRangeMs = DEFAULT_DELAY_RANGE_MS,
    maxPerSession = DEFAULT_MAX_PER_SESSION,
    pauseMs = DEFAULT_PAUSE_MS,
    sleep = defaultSleep
  }) {
    const queue = [];
    const known = new Set();
    let draining = false;
    let paused = false;
    let accepted = 0;
    let completed = 0;

    function pauseTemporarily() {
      paused = true;
      onChange();
      setTimeout(() => {
        paused = false;
        onChange();
        drain();
      }, pauseMs);
    }

    async function download(job) {
      try {
        const response = await fetchFn(job.url, REQUEST_OPTIONS);
        return isBlocked(response) ? null : await response.text();
      } catch (_) {
        return null;
      }
    }

    async function drain() {
      if (draining) return;
      draining = true;
      while (queue.length && !paused) {
        const job = queue.shift();
        const html = await download(job);
        if (html === null) {
          queue.unshift(job);
          pauseTemporarily();
          break;
        }
        completed++;
        onResult(job.id, parser.parse(html));
        onChange();
        await sleep(randomBetween(...delayRangeMs));
      }
      draining = false;
    }

    return {
      enqueue(id, url) {
        if (known.has(id)) return 'duplicate';
        if (accepted >= maxPerSession) return 'full';
        known.add(id);
        accepted++;
        queue.push({ id, url });
        drain();
        return 'queued';
      },
      stats: () => ({
        queued: queue.length + (draining && !paused ? 1 : 0),
        done: completed,
        paused
      })
    };
  }

  const api = { create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MKF = Object.assign(root.MKF || {}, { DescriptionFetcher: api });
})(typeof globalThis !== 'undefined' ? globalThis : this);
