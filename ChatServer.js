const express = require('express');

const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server,
{
  cors:{
  origin:"http://localhost:3000"
  }
})
// app.use(corp())
// app.get('/', (req, res) => {
//  res.send("mghf")
// });

io.on('connection', (socket) => {
  console.log(socket)
  socket.on("test",data=>{
    console.log(data)
  })
 
});

server.listen(1337, () => {
  console.log('listening on *:1337');
});