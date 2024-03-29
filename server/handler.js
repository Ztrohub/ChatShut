const { rooms } = require('./index')
const { generateUsername } = require('unique-username-generator')

module.exports = (io) => {
    const joinRoom = function () {
        const socket = this
        const room = socket.handshake.query.room
        socket.join(room)

        const userName = socket.handshake.cookies.userName || generateUsername('-', 3)
        const publicKey = socket.handshake.cookies.publicKey

        rooms[room].users.push({
            userName: userName,
            publicKey: publicKey
        })

        socket.handshake.cookies.userName = userName

        io.to(room).emit('announce', `User ${userName} has joined the room`, rooms[room].users)
    }

    const chatMessage = function (messages) {
        const socket = this
        const room = socket.handshake.query.room

        const encryptedMessages = messages

        // for (const user of rooms[room].users){
        //     if (user.userName === socket.handshake.cookies.userName) continue

        //     const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
        //     const encryptedMessage = sodium.crypto_box_easy({message: message, nonce: nonce, publicKey: user.publicKey, privateKey: privateKey})

        //     encryptedMessages.push({
        //         userName: user.userName,
        //         encryptedMessage: encryptedMessage,
        //         nonce: nonce
        //     })
        // }

        socket.broadcast.to(room).emit('chat-message', encryptedMessages)
    }

    const disconnect = function () {
        const socket = this
        const room = socket.handshake.query.room

        const userName = socket.handshake.cookies.userName
        rooms[room].users = rooms[room].users.filter(user => user.userName !== userName)

        io.to(room).emit('announce', `User ${userName} has left the room`, rooms[room].users)
    }

    return {
        joinRoom,
        chatMessage,
        disconnect
    }
}