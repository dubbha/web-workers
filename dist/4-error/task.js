// Fibonacci without memoization - a heavy one
function fib(n) {
  if (n === 0  || n === 1) {
    return  n;
  }

  return fib(n - 2) + fib(n - 1);
}

self.addEventListener('message', (message) => {
  console.log('Web Worker received message:', message);

  const a = 2;
  a = 4;          // try changing a constant

  self.postMessage({ a });  // send result back (should never be reached)
});


