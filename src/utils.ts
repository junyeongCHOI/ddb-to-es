export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) result.push(array.slice(i, i + chunkSize));
  return result;
};

const calculateExponentialBackoffDelayWithJitter = (i: number, cap = 1000, base = 100) => {
  return Math.random() * Math.min(cap, base * 2 ** i);
};

export async function exponentialBackoff<T>(fn: () => Promise<T>, maxAttempts: number): Promise<T> {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const retry = () => {
      attempts++;
      fn()
        .then(resolve)
        .catch((error: any) => {
          if (attempts > maxAttempts) {
            reject(error);
          } else {
            const delay = calculateExponentialBackoffDelayWithJitter(attempts);
            setTimeout(retry, delay);
          }
        });
    };
    retry();
  });
}
