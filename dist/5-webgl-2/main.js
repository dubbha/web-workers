import { generateMatrices, calculateGpuResult } from './matrix.js'

const worker = new Worker('./worker.js');  // init web worker

const trigger = document.querySelector('#trigger');
const triggerNoWW = document.querySelector('#triggerNoWW');

worker.addEventListener('message', message => {  // listener for messages from web worker
  // console.log(message);

  trigger.innerText = `Result from Web Worker size: ${message.data.result.length}.
Generation took: ${Math.ceil(message.data.time.generation)} ms.
Caculation took: ${Math.ceil(message.data.time.calculation)} ms.
Run again?`;
  trigger.onclick = run;
  document.querySelector('#spinner').classList.remove('active');
});

function run() {
  trigger.innerText = 'Running the task... UI stays responsive [check buttons above]';
  trigger.onclick = null;
  document.querySelector('#spinner').classList.add('active');

  const webglCanvas = new OffscreenCanvas(1, 1); // offscreen canvas, need to create it here, because it will be detached after first run
  worker.postMessage(
    {
      canvas: webglCanvas,
      size: 1024,
    },
    [webglCanvas],
  );
}

function runNoWW() {
  triggerNoWW.innerText = `Running the task... UI is not responsive [buttons above won\'t work until finished].
We gave spinner 100ms to appear and start animating.`;
  triggerNoWW.onclick = null;

  const canvas = new OffscreenCanvas(1, 1); // offscreen canvas, need to create it here, because it will be detached after first run
  const size = 1024

  document.querySelector('#spinnerNoWW').classList.add('active');
  setTimeout(() => { // 100ms timeout lets spinner some time to appear
    const startTime = performance.now();
    generateMatrices(size);
    const generationTime = performance.now();
    const result = calculateGpuResult(canvas, size);
    const endTime = performance.now();

    const time = {
      generation: generationTime - startTime,
      calculation: endTime - generationTime,
    }
    // console.log({ result, time });

    triggerNoWW.innerText = `Result without Web Worker size: ${result.length}.
  Generation took: ${Math.ceil(time.generation)} ms.
  Caculation took: ${Math.ceil(time.calculation)} ms.
  Run again?`;
    triggerNoWW.onclick = runNoWW;

    document.querySelector('#spinnerNoWW').classList.remove('active');
  }, 100)
}


function setBg(color) {
  document.querySelector('body').className = color;
}

document.getElementById('r').addEventListener('click', () => setBg('red'));
document.getElementById('g').addEventListener('click', () => setBg('green'));
document.getElementById('b').addEventListener('click', () => setBg('blue'));

trigger.onclick = run;
triggerNoWW.onclick = runNoWW;