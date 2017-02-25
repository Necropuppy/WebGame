var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

require('./Vector2');

Entity = function(){
	var self = {
		pos: Vector2(250, 250),
		vel: Vector2(0, 0),
		size: Vector2(0, 0),
		id:"",
	}
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function(){
		pos = pos.add(vel);
	}
	self.getDistance = function(pt){
		return pos.dist(pt);
	}
	return self;
}

Entity.getFrameUpdateData = function(){
	var pack = {
		initPack:{
			player:initPack.player,
			bullet:initPack.bullet,
		},
		removePack:{
			player:removePack.player,
			bullet:removePack.bullet,
		},
		updatePack:{
			player:Player.update(),
			bullet:Bullet.update(),
		}
	};
	initPack.player = [];
	initPack.bullet = [];
	removePack.player = [];
	removePack.bullet = [];
	return pack;
}

Player = function(id, username){
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
	self.shootBullet = function(angle){
		var b = Bullet(self.id,angle);
		b.pos = self.pos;
	}

	self.updateSpd = function(){
		if(self.pressingRight)
			self.vel.x = self.maxSpd;
		else if(self.pressingLeft)
			self.vel.x = -self.maxSpd;
		else
			self.vel.x = 0;

		if(self.pressingUp)
			self.vel.y = -self.maxSpd;
		else if(self.pressingDown)
			self.vel.y = self.maxSpd;
		else
			self.vel.y = 0;
	}

	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			number:self.number,
			name:self.username,
			hp:self.hp,
			hpMax:self.hpMax,
			score:self.score,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			hp:self.hp,
			score:self.score,
			name:self.username,
		}
	}

	Player.list[id] = self;

	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};
Player.onConnect = function(socket, username){
	var player = Player(socket.id, username);
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

	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(),
		bullet:Bullet.getAllInitPack(),
	})
}
Player.getAllInitPack = function(){
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}
Player.update = function(){
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}


Bullet = function(parent,angle){
	var self = Entity();
	self.id = Math.random();
	self.vel = Vector2.Polar(10, angle);
	self.parent = parent;
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();

		for(var i in Player.list){
			var p = Player.list[i];
			if(self.getDistance(p) < 32 && self.parent !== p.id){
				p.hp -= 1;

				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.score += 1;
					p.hp = p.hpMax;
					p.pos = Vector2.Random(500, 500);
				}
				self.toRemove = true;
			}
		}
	}
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
		};
	}

	Bullet.list[self.id] = self;
	initPack.bullet.push(self.getInitPack());
	return self;
}
Bullet.list = {};

Bullet.update = function(){
	var pack = [];
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.bullet.push(bullet.id);
		} else
			pack.push(bullet.getUpdatePack());
	}
	return pack;
}

Bullet.getAllInitPack = function(){
	var bullets = [];
	for(var i in Bullet.list)
		bullets.push(Bullet.list[i].getInitPack());
	return bullets;
}
