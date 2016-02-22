var fs = require('fs');
var app = require('express')();
var bodyParser = require('body-parser');
var socketIo = require('socket.io');
var markdown = require('markdown').markdown;

app.use(bodyParser.text());

fs.readFile('wiki.html', 'utf8', function(err, html) {
  if (err) throw err;

  app.get('/', function(req, res) {
    fs.readFile('content.md', 'utf8', function(err, content) {
      if (err) {
        return res.status(500).send('Error reading content');
      }
      var markdownContent = content ? content : '## Edit the text below';
      res.send(
        html.replace('{{content}}', markdown.toHTML(markdownContent))
        .replace('{{content-edit}}', markdownContent)
      );
    });
  });
});

var server = app.listen(process.env.port || 1337, function() {
  console.log('Listening on', server.address().port);
});

var io = socketIo(server);

io.on('connection', function(socket) {
  socket.on('content-edit', function(content) {
    var trimmed = content.trim();
    if (trimmed) {
      io.emit('markdown', trimmed);
      return fs.writeFile('content.md', trimmed, function(err) {
        return err ? io.emit('error', 'Error saving content') : io.emit('markdown-html', markdown.toHTML(trimmed));
      });
    }
    io.emit('error', 'Please enter something');
  });
});
