// Fibonacci without memoization - a heavy one
function fib(n) {
  if (n === 0  || n === 1) {
    return  n;
  }

  return fib(n - 2) + fib(n - 1);
}

self.addEventListener('message', (message) => {
  console.log('Web Worker received message:', message);   // message is an array

  const result = message.data.map(arg => fib(arg));

  self.postMessage(result);  // send result back, result is an array
});


