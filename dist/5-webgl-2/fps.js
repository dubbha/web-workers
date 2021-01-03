// FPS counter
const times = [];
let fps = 0;
let fpses = [];
const seconds = 8;

const canvas = document.getElementById("fps");
const context = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

context.fillStyle = "Black";
context.font = "normal 16pt Arial";

function showFPS() {
  context.clearRect(0, 0, width, height);
  context.fillText(fps + " fps", 30, 20);
  context.fillRect(118, 64 - fps, 1, 1);
  fpses.forEach((fps, i) => context.fillRect(118 + i, 64 - fps, 1, 1));
  for (let i = 0; i <= seconds; i++) {
    context.fillRect(117 + i * 60, 1, 1, 2);
  }
  context.fillText(Date.now().toString().substr(-4), 30, 50);
}

let lastTime = performance.now();
refreshLoop();

function refreshLoop() {
  requestAnimationFrame((now) => {
    times.push(now);
    if (now > lastTime && fpses.length < 60) {
      fps = Math.min(Math.round(1000 / (now - lastTime)), 60);
      lastTime = now;
    } else {
      while (times[0] <= now - 1000) {
        times.shift();
      }
      fps = Math.min(times.length, 60);
    }
    if (fpses.length > 60 * seconds) {
      fpses.shift();
    }
    fpses.push(fps);
    showFPS();
    refreshLoop();
  });
}
