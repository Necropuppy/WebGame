// Copyright 2017 Nathan Foote and Arda Pekis

// Mongo DB imports and setup
var mongojs = require("mongojs");
var db = mongojs('Public:secret@localhost:27017/myGame', ['account','progress']);

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

// Activates the server on the port in config.json
serv.listen(config.port);
console.log("Server started.");

// List of connected clients
var SOCKET_LIST = {};

// The base for all entities on the game map.
var Entity = function(){
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}

/******** PLAYER DEFINITION AND UTILITIES *******/
// The base for all player entities on the game map.
var Player = function(id, username){
	var self = Entity();
	self.id = id;
	self.number = "" + Math.floor(10 * Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingAttack = false;
	self.mouseAngle = 0;
	self.maxSpd = 10;
	self.hp = 10;
	self.hpMax = 10;
	self.score = 0;
	self.username = username;

	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();

		if(self.pressingAttack){
			self.shootBullet(self.mouseAngle);
		}
	}

	// Launches a new bullet from the player at the specified angle
	self.shootBullet = function(angle){
		var b = Bullet(self.id,angle);
		b.x = self.x;
		b.y = self.y;
	}

	// Changes the player's speed based on their controls
	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdX = self.maxSpd;
		else if(self.pressingLeft)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;

		if(self.pressingUp)
			self.spdY = -self.maxSpd;
		else if(self.pressingDown)
			self.spdY = self.maxSpd;
		else
			self.spdY = 0;
	}

	// Serializes all of the state information of this player.
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			number:self.number,
			name:self.username,
			hp:self.hp,
			hpMax:self.hpMax,
			score:self.score,
		};
	}

	// Serializes player data that changes over time.
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			score:self.score,
			name:self.username,
		}
	}

	// Adds this new player to the global player list
	Player.list[id] = self;

	// Add this player to the global init pack.
	initPack.player.push(self.getInitPack());
	return self;
}

// List of all players currently in the game.
Player.list = {};

// Handles the initial connection of a player.
Player.onConnect = function(socket, username){
	var player = Player(socket.id, username);

	// Handles the input controls for the player.
	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});

	// Sends the init pack to the user with the entire game state.
	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})
}

// All state information for players in the game.
Player.getAllInitPack = function(){
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

// Handles the disconnection of a player.
Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}

// Incrementally updates all players' game state information.
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}

/******** BULLET DEFINITION AND UTILITIES ********/
// Bullet entity for projectiles that collide and cause damage.
var Bullet = function(parent,angle){
	var self = Entity();
	self.id = Math.random();
	self.spdX = Math.cos(angle/180*Math.PI) * 10;
	self.spdY = Math.sin(angle/180*Math.PI) * 10;
	self.parent = parent;
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		// Kills the bullet after 100 frames
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();

		// Collision detection loop
		for(var i in Player.list){
			var p = Player.list[i];
			// Check if the bullet is within a radius of 32 pixels of a player
			if(self.getDistance(p) < 32 && self.parent !== p.id){
				p.hp -= 1;
				// Check if the player just hit is dead.
				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					// Increment the score of the murderer, if one exists.
					if(shooter)
						shooter.score += 1;
					// Respawns the player.
					p.hp = p.hpMax;
					p.x = Math.random() * 500;
					p.y = Math.random() * 500;
				}
				self.toRemove = true;
			}
		}
	}

	// Returns all of the state information for the bullet.
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}
	// Returns all state information that has changed.
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}

	// Adds the new bullet to the global lists.
	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;
}
// Global bullet list
Bullet.list = {};

// Updates all of the bullets in the game.
Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		// Add bullet update to the appropriate global data pack.
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());
	}
	return pack;
}

// Gets all the state information for bullets.
Bullet.getAllInitPack = function(){
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}


/******** SERVER CALLBACKS ********/
// Allows DEBUG commands to be used in chat. DANGER!!!
var DEBUG = true;

// Check if the client entered a valid password.
var isValidPassword = function(data,cb){
	db.account.find({username:data.username,password:data.password},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
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

	// Handles client sign-ins. 'data' contains the username and password
	socket.on('signIn',function(data){
		isValidPassword(data,function(res){
			if(res){
				// Log the client in and create a player in the game.
				Player.onConnect(socket, data.username);
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

// The global lists of data to send to the clients.
var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

// The main game loop.
setInterval(function(){
	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
	}

	// Send data packs to all connected clients.
	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init',initPack);
		socket.emit('update',pack);
		socket.emit('remove',removePack);
	}

	// Reset the data packs to empty, to be filled for the next frame.
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
// Run at 25 FPS.
},1000/25);
