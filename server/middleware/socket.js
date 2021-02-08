const socket = io('/')

socket.emit('join-room', 1234, 10)