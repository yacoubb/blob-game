const express = require('express');
const path = require('path');
const minimist = require('minimist');

// have to use express server over npx serve since we need to route /*
// so far haven't figured out a way to do that using npx serve...

const app = express();

app.use(express.static(path.join(__dirname, 'build')));

app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const args = minimist(process.argv.slice(2));
const PORT = args.port ?? 3000;

app.listen(PORT, () => {
  console.log(`blobgame web server listening at http://localhost:${PORT}`);
});
