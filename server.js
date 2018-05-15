var express = require('express');

var app = express();

app.use(express.static('dist'));

var port = 3000;
app.listen(port, () => {
  console.log(`listening on *:${port} [ http://127.0.0.1:${port}, http://localhost:${port}/ ]`);
});