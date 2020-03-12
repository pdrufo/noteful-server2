const express = require('express');
app.get('/ping', (req, res) => {
  res.send('Pong!')
});

module.exports = pingRouter;