const worker = new Worker('./worker.js');  // init web worker

const body = document.querySelector('body');
const triggerWGL = document.querySelector('#triggerWGL');
const trigger = document.querySelector('#trigger');

worker.addEventListener('message', message => {  // listener for messages from web worker
  // console.log(message);

  trigger.innerText = `Result from Web Worker size: ${message.data.result.length}.
Generation took: ${Math.ceil(message.data.time.generation)} ms.
Caculation took: ${Math.ceil(message.data.time.calculation)} ms.
Check console for details.
Run again?`;
  trigger.onclick = run;
});

function run() {
  trigger.innerText = 'Running the task... UI stays responsive [check buttons above]';
  trigger.onclick = null;

  const webglCanvas = new OffscreenCanvas(1, 1); // offscreen canvas, need to create it here, because it will be detached after first run
  worker.postMessage(
    {
      canvas: webglCanvas,
      size: 1024,
    },
    [webglCanvas],
  );
}

function setBg(color) {
  document.querySelector('body').className = color;
}

document.getElementById('r').addEventListener('click', () => setBg('red'));
document.getElementById('g').addEventListener('click', () => setBg('green'));
document.getElementById('b').addEventListener('click', () => setBg('blue'));

trigger.onclick = run;