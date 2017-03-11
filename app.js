// Copyright 2017 Nathan Foote and Arda Pekis

// Mongo DB imports and setup
var mongojs = require("mongojs");
var db = mongojs('@localhost:27017/myGame', ['account']);

require('./Entity');
require('./Map');

// Express imports and setup
var express = require('express');
var app = express();
var serv = require('http').Server(app);

// Loads server-specific config file. config.json should NOT be in the git repo
var config = require('./config.json');

// Serves the client folder to the client.
app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
Map("One");
Tower.onStart();
Base.onStart();

// Activates the server on the port in config.json
serv.listen(config.port);
console.log("Server started.");

// List of connected clients
var SOCKET_LIST = {};
var team0size = 0;
var team1size = 0;

/******** SERVER CALLBACKS ********/
// Allows DEBUG commands to be used in chat. DANGER!!!
var DEBUG = true;
var DB_ON = false;

// Check if the client entered a valid password.
var isValidPassword = function(data,cb){
	if (DB_ON) {
		db.account.find({username:data.username,password:data.password},function(err,res){
			if(res.length > 0)
				cb(true);
			else
				cb(false);
		});
	} else {
		cb(true);
	}
}

// Check if the client entered an existing username
var isUsernameTaken = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
}

// Register a new username and password into the database.
var addUser = function(data,cb){
	db.account.insert({username:data.username,password:data.password},function(err){
		cb();
	});
}

// Import the socket.io library.
var io = require('socket.io')(serv,{});
// Establishes data connection to client.

io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;


	socket.emit("mapInit", World.getMapUpdateData().initPack);
	socket.emit("baseInit", Entity.getFrameUpdateData().initPack);

	// Handles client sign-ins. 'data' contains the username and password
	socket.on('signIn',function(data){
		isValidPassword(data,function(res){
			if(res){
				// Log the client in and create a player in the game.
				if(team0size > team1size){
					Player.onConnect(socket, data.username,1);
					team1size = team1size + 1;
				}else{
					Player.onConnect(socket, data.username,0);
					team0size= team0size + 1;
				}
				
				socket.emit('signInResponse',{success:true});
			} else {
				socket.emit('signInResponse',{success:false});
			}
		});
	});

	// Handles registration of new players.
	socket.on('signUp',function(data){
		isUsernameTaken(data,function(res){
			if(res){
				socket.emit('signUpResponse',{success:false});
			} else {
				addUser(data,function(){
					socket.emit('signUpResponse',{success:true});
				});
			}
		});
	});

	// Removes the client and its player when the client disconnects.
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});

	// Handles incoming chat messages from the client.
	socket.on('sendMsgToServer',function(data){
		var playerName = ("" + Player.list[socket.id].username).slice(0,20);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
		}
	});

	// Handles incoming DEBUG commands from the client.
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);
	});
});

// The main game loop.
setInterval(function(){
	var packs = Entity.getFrameUpdateData();
	//var mapPacks = World.getMapUpdateData();
	for(var i in SOCKET_LIST){
		// Send the updates to all of the clients.
		var socket = SOCKET_LIST[i];
		socket.emit('init',packs.initPack);
		socket.emit('update',packs.updatePack);
		socket.emit('remove',packs.removePack);
		//socket.emit('towerUpdate', packs.)
		//socket.emit('mapInit',mapPacks.initPack);
	}
},1000/fps);
