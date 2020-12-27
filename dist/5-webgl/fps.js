// FPS counter
const times = [];
let fps = 0;
let fpses = [];

const canvas = document.getElementById("fps");
const context = canvas.getContext("2d");
const width = canvas.width;
const height = canvas.height;

context.fillStyle = "Black";
context.font = "normal 16pt Arial";

function showFPS() {
  context.clearRect(0, 0, width, height);
  context.fillText(fps + " fps", 10, 20);
  context.fillRect(75, 61 - fps, 1, 1);
  times.forEach((t, i) => context.fillRect(75 + i, 61 - fpses[i], 1, 1));
}

let lastTime = performance.now();
refreshLoop();

function refreshLoop() {
  requestAnimationFrame((now) => {
    times.push(now);
    if (now > lastTime && times.length < 60) {
      fps = Math.min(Math.round(1000 / (now - lastTime)), 60);
      lastTime = now;
    } else {
      while (times[0] <= now - 1000) {
        times.shift();
      }
      fps = Math.min(times.length, 60);
    }
    if (fpses.length > 60) {
      fpses.shift();
    }
    fpses.push(fps);
    showFPS();
    refreshLoop();
  });
}
