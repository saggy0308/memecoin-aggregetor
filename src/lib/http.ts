import axios from "axios";
import axiosRetry from "axios-retry";

const http = axios.create({
  timeout: 5000, // 5 seconds
});

// Exponential backoff + jitter
axiosRetry(http, {
  retries: 5,
  retryDelay: (retryCount) => {
    const base = Math.pow(2, retryCount) * 200; // 200, 400, 800, 1600...
    const jitter = Math.random() * 200;
    return base + jitter;
  },
  retryCondition: (error) => {
    // Retry on:
    // - network errors
    // - 5xx
    // - 429 rate limits
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

export default http;
