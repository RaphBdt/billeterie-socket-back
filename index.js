const express = require('express')
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const port = 3003;

app.use(cors());

const jsonParser = bodyParser.json();

const filepath = path.resolve(__dirname, 'bdd.json');

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});

const saveData = async (data) => {
    await fs.promises.writeFile(filepath, JSON.stringify(data));
}

const getData = async () => {
    const raw =  await fs.promises.readFile(filepath, 'utf8');
    return JSON.parse(raw);
}

let playersConnected = 0; 

io.on('connection', (socket) => {
    playersConnected++;

    async function getAllThePlaces() {
        const data = await getData();
        io.emit('allThePlaces', data);
    };

    getAllThePlaces();

    socket.on('disconnect', () => {
        playersConnected--;
        io.emit('users', playersConnected);
    });

    io.emit('users', playersConnected);
})

app.post('/buy',jsonParser, async (req, res) => {
    const data = await getData();

    if(req.body.place && req.body.user) {

        req.body.place.forEach(element => {            
            const place = data.places.find(place => place.id === element);
            place.reserved = true;
            place.user = req.body.user;
        });

        saveData(data);

        res.send({data, error: false})
    } else {
        res.send({error : true});
    }

});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
    res.send('hello world');
});

server.listen(port, function() {
    console.log('listening on localhost:' + port);
});