const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const mongoose = require('mongoose')

const Document = require('./Document')
const { DB_URI } = require('./configs');

const app = express()

const server = http.createServer(app)
const io = socketio(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  }
})

// Connecting to database
mongoose
    .connect(DB_URI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB connected'))
    .catch((err) => console.log(err))
//set mongoose's Promise equal to global Promise since mongoose's Promise version is depricated
mongoose.Promise = global.Promise;

const defaultValue = ''

io.on('connection', socket => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId)

    // documentId acts as room
    socket.join(documentId)
    socket.emit('load-document', document.data)

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}

app.use(express.static(path.join(__dirname, './client/build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'));
})

const PORT = process.env.PORT || 4500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));