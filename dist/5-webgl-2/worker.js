let canvas;

self.addEventListener('message', (message) => {
  // console.log('Web Worker received message:', message);

	if (message.data.canvas) { // expect canvas to only be passed once, in a separate message
		canvas = message.data.canvas; 
		return;
	}

	const { size = 3 } = message.data;
  
  const startTime = performance.now();
  generateMatrices(size);
  const generationTime = performance.now();
  const result = calculateGpuResult(canvas, size);
  const endTime = performance.now();

  // console.log(result);

  self.postMessage({
    result,
    time: {
      generation: generationTime - startTime,
      calculation: endTime - generationTime,
    },
  });
});

// Matrices multiplication in WebGL

let inputLeft = [];
let inputRight = [];
let resultGpu = [];
let highlight = [0,0];

const generateMatrices = (size) => {
	inputLeft = [];
	inputRight = [];
	resultGpu = [];

	for(let i = 0; i < size * size; i++) {
		inputLeft.push(Math.round(Math.random()*10));
		inputRight.push(Math.round(Math.random()*10));
	}

	highlight = [0,0];
}


const toImageDataArray = (data) => {
	// console.log(data);
	const array = [];
	for(let i = 0; i < data.length; i++) {
		array.push(0);
		array.push(0);
		array.push(0);
		array.push(data[i]);
	}
	// console.log(array);
	return new Uint8ClampedArray(array);
};

const fromImageDataArray = (data) => {
	// console.log(data);
	const array = [];
	for(let i = 0; i< data.length; i += 4){
		const value = data[i + 3] +
			(data[i + 2] << 8 >>> 0) +
			(data[i + 1] << 16 >>> 0) +
			(data[i] << 24 >>> 0);
		array.push(value);
	}
	// console.log(array);
	return array;
}

const calculateGpuResult = (canvas, size) => {
	canvas.width = canvas.height = size;
	const gl = canvas.getContext('webgl');
	let vertexBuffer;
	let vPosition;
	let textureLeft;
	let textureRight;
	let uSamplerLeft;
	let uSamplerRight;

	gl.clearColor(0,0,0,0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	initShaders();
	initBuffers();
	initTextures();
	return draw();

	function draw(){
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textureLeft);
		gl.uniform1i(uSamplerLeft, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textureRight);
		gl.uniform1i(uSamplerRight, 1);

		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

		gl.flush();
		let pixels = new Uint8Array(size * size * 4);
		gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
		// console.log('pixels', pixels);
    // console.log(pixels.length);

		return fromImageDataArray(pixels);
	}

	function initBuffers(){
		vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		const vertices = [
			1, 1, 0,
			-1, 1, 0,
			1, -1, 0,
			-1, -1, 0
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	}

	function initShaders(){
		const vertexShader = getVertexShader();
		const fragmentShader = getFragmentShader();

		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			console.error("Unable to initialize the shader program.");
		} else {
			// console.log("Initialized shader program");
		}

		gl.useProgram(shaderProgram);

		uSamplerLeft = gl.getUniformLocation(shaderProgram, "uSamplerLeft");
		uSamplerRight = gl.getUniformLocation(shaderProgram, "uSamplerRight");

		vPosition = gl.getAttribLocation(shaderProgram, "vPosition");
		gl.enableVertexAttribArray(vPosition);
	}

	function initTextures() {
		{
			textureLeft = gl.createTexture();
			const imageData = new ImageData(toImageDataArray(inputLeft), size, size);
			// console.log('left imageData',imageData.data);


			gl.bindTexture(gl.TEXTURE_2D, textureLeft);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}

		{
			textureRight = gl.createTexture();

			const imageData = new ImageData(toImageDataArray(inputRight), size, size);
			// console.log('right imageData',imageData.data);

			gl.bindTexture(gl.TEXTURE_2D, textureRight);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
	}

  function getVertexShader(){
		const shader = gl.createShader(gl.VERTEX_SHADER);
		const source = `
			precision highp float;
			attribute vec3 vPosition;
			varying vec2 vCoord;
			void main(void) {
				vCoord = vec2((vPosition.s+1.0)/2.0, (vPosition.t+1.0)/2.0);
				gl_Position = vec4(vPosition, 1.0);
			}
		`;
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		} else {
			// console.log("Vertex shader compiled");
		}

		return shader;
	}

	function getFragmentShader(){
		const shader = gl.createShader(gl.FRAGMENT_SHADER);
		const source = `
			precision highp float;
			uniform sampler2D uSamplerLeft;
			uniform sampler2D uSamplerRight;
			varying vec2 vCoord;

			float floatFromVec4(vec4 v) {
				return (v.r*pow(2.0,24.0) + v.g*pow(2.0,16.0) + v.b*pow(2.0,8.0) + v.a*pow(2.0,0.0));
			}

			// Row = t, col = s
			void main(void) {
				float sum = 0.0;
				for(int i = 0; i < ${size}; i++) {
					vec4 cLeft = texture2D(uSamplerLeft, vec2(float(i)/${size}.0, vCoord.t));
					vec4 cRight = texture2D(uSamplerRight, vec2(vCoord.s, float(i)/${size}.0));
					sum = sum + (floatFromVec4(cLeft)*255.0 * floatFromVec4(cRight)*255.0);
				}

				float a = (mod(sum, pow(2.0,8.0)));
				float b = (mod(sum - a, pow(2.0,16.0))) * pow(2.0, -8.0);
				float g = (mod(sum - b - a, pow(2.0,24.0))) * pow(2.0, -16.0);
				float r = (mod(sum - g - b - a, pow(2.0,32.0))) * pow(2.0, -24.0);
				gl_FragColor = vec4(
					r/255.0,
					g/255.0,
					b/255.0,
					a/255.0
				);
			}
		`;
		// console.log(source);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
			return null;
		}else{
			// console.log("Fragment shader compiled");
		}
		return shader;
	}
};

