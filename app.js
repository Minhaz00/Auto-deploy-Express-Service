const express = require('express');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Hello World! Express server is running on port 5000.');
  // res.send('We did it!');
});

app.listen(port, () => {
  console.log(`Express server listening at http://localhost:${port}`);
});