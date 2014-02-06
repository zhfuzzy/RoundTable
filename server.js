var static = require('node-static');
var http = require('http');
var file = new(static.Server)();
var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(2013);

var roomtable = {};
var maxClients = 4;
var io = require('socket.io').listen(app);
io.sockets.on('connection', function (client){

    function log(){
	var array = [">>> Message from server: "];
	for (var i = 0; i < arguments.length; i++) {
	    array.push(arguments[i]);
	}
	client.emit('log', array);
    }

    //room index
    function updateIndex() {
	var idtable = [];
	idtable.push(roomtable[client.room].length - 1);
	for (var i = 1; i < roomtable[client.room].length; i++) {
	    idtable.push(roomtable[client.room][i].id);
	}
	for (var i = 1; i < roomtable[client.room].length; i++) {
	    roomtable[client.room][i].emit('index', i, idtable);
	}
    }

    //room broadcast, arg: a list of room member
    client.on('broadcast', function(type, message) {
	console.log('Transporting board message: ',  message);
	for(var i = 1; i < roomtable[client.room].length; i++)
	    roomtable[client.room][i].emit('broadcast', client.id, type, message);
    });


    client.on('message', function (message) {
	console.log('Send Message, from : ', client.id);
	console.log('                to :  ALL');
	console.log('               msg : ', message);
	if (message === 'bye') {
	    if (!roomtable[client.room]) return;
	    var i = roomtable[client.room].indexOf(client);
	    roomtable[client.room].splice(i,1);
	    if (roomtable[client.room].length >= 2) {
		updateIndex();
	    } else {
		roomtable[client.room] = undefined;
		console.log(client.room, 'cleard');
		return;
	    }
	}
	
	for (var i = 1; i < roomtable[client.room].length; i++) {
	    roomtable[client.room][i].emit('message', client.id, message);
	}
    });
    
    client.on('messageTo', function (to, message) {
	console.log('Send Message, from : ', client.id);
	console.log('                to : ', to);
	console.log('               msg : ', message);
	for (var i = 1; i < roomtable[client.room].length; i++) {
	    if(roomtable[client.room][i].id !== to) continue;
	    roomtable[client.room][i].emit('messageFrom', client.id, message);
	}
    });

    client.on('create or join', function (room, name, initColor) {
	var numClients;
	if (!roomtable[room]) {
	    numClients = 0;
	    roomtable[room] = [];
	    roomtable[room][0] = maxClients; 
	    // roomtable[room][0] reserved for max clients and etc.
	    roomtable[room].push(client);
	} else {
	    numClients = roomtable[room].length - 1;
	    roomtable[room].push(client);
	}
	client['room'] = room;
	client['name'] = name;
	updateIndex();
	
	log('Room ' + room + ' has ' + numClients + ' client(s)');
	log('Request to create or join room', room);
	
	if (numClients == 0){
	    client.join(room);
	    roomtable[room].initColor = initColor;
	    client.emit('created', room);
	} else if (numClients <= roomtable[room][0] - 1) {
	    var namehash = {};
	    for (var i = 1; i <= numClients; i++) {
		roomtable[room][i].emit('join', client.id, client.name);
		namehash[roomtable[room][i].id] = roomtable[room][i].name;
	    }
	    client.join(room);
	    client.emit('joined', room, namehash, roomtable[room].initColor);
	} else { // max: rootable[room][0] clients
	    client.emit('full', room);
	}

    });
});
