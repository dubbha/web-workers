// Fibonacci without memoization - a heavy one
function fib(n) {
  if (n === 0  || n === 1) {
    return  n;
  }

  return fib(n - 2) + fib(n - 1);
}

self.addEventListener('message', (message) => {
  console.log('Web Worker received message:', message);

  const { func, args } = message.data;  // { func: 'fib', args: [...] }

  let result;
  switch (func) {
    case 'fib':
      result = args.map(arg => fib(arg));
      break;
    default:
      result = args;   // return args unchanged
  }

  self.postMessage({ result });  // send result back, an object { result: [...] }
});


