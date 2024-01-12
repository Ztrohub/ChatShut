require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const crypto = require('crypto')

const { joinRoom, chatMessage, disconnect  } = require('./handler')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const httpServer = createServer(app)

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true
    }
})

const rooms = {}

function generateRoomId() {
    return crypto.randomBytes(4).toString('hex')
}

app.post('/room', (req, res) => {
    const roomId = generateRoomId()
    rooms[roomId] = {
        pin: req.body.pin,
        users: []
    }

    res.status(201).json({
        roomId
    })
})

app.get('/room/:room', (req, res) => {
    const { room } = req.params

    if (rooms[room] == null) {
        return res.status(404).json({
            message: 'Room not found'
        })
    }

    res.status(200).json({
        message: 'Success'
    })
})

app.post('/room/:room', (req, res) => {
    const { room } = req.params

    if (rooms[room] == null) {
        return res.status(404).json({
            message: 'Room not found'
        })
    }

    const { pin } = req.body

    if (rooms[room].pin !== pin) {
        return res.status(403).json({
            message: 'Wrong pin'
        })
    }

    res.status(200).json({
        message: 'Success'
    })
})

io.on('connection', (socket) => {
    socket.on('join-room', joinRoom)
    socket.on('chat-message', chatMessage)
    socket.on('disconnect', disconnect)
})

httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})

module.exports = {
    rooms
}