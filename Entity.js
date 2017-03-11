var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};
fps = 25;

require('./Vector2');
require('./Map');

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
		self.pos = Vector2.add(self.pos, self.vel);
	}
	self.isPositionWall = function(pt){
		return simple[(Math.floor(pt.y / 64) % simple.length)][(Math.floor(pt.x / 64) % simple[0].length)];
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
	self.maxSpd = 250 / fps;
	self.hp = 10;
	self.hpMax = 10;
	self.score = 0;
	self.username = username;
	self.mp = 100;
	self.mpMax = 100;
	self.xp = 0;
	self.xpMax = 10;

	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();

		if(self.mp < self.mpMax){
			self.mp +=1;
		}

		if(self.pressingAttack){
			self.shootBullet(self.mouseAngle);
		}
	}

	self.shootBullet = function(angle){
		if(self.mp > 9){
			var b = Bullet(self.id,angle);
			b.pos = self.pos;
			self.mp -= 10;
		}
	}

	self.updateSpd = function(){
		if(self.pressingRight && !self.isPositionWall(Vector2.add(self.pos, Vector2(self.maxSpd, 0))))
			self.vel.x = self.maxSpd;
		else if(self.pressingLeft && !self.isPositionWall(Vector2.add(self.pos, Vector2(-self.maxSpd, 0))))
			self.vel.x = -self.maxSpd;
		else
			self.vel.x = 0;

		if(self.pressingUp && !self.isPositionWall(Vector2.add(self.pos, Vector2(0, -self.maxSpd))))
			self.vel.y = -self.maxSpd;
		else if(self.pressingDown && !self.isPositionWall(Vector2.add(self.pos, Vector2(0, self.maxSpd))))
			self.vel.y = self.maxSpd;
		else
			self.vel.y = 0;
	}

	self.respawn = function (){
		self.pos = Vector2(256, 256);
		self.hp = self.hpMax;
	}

	self.respawn();

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
			right:self.pressingRight,
			left:self.pressingLeft,
			up:self.pressingUp,
			down:self.pressingDown,
			mp:self.mp,
			mpMax:self.mpMax,
			xp:self.xp,
			xpMax:self.xpMax,
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
			right:self.pressingRight,
			left:self.pressingLeft,
			up:self.pressingUp,
			down:self.pressingDown,
			mp:self.mp,
			mpMax:self.mpMax,
			xp:self.xp,
			xpMax:self.xpMax,
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
		else if(data.inputId === 'stop') {
			player.pressingRight = false;
			player.pressingDown = false;
			player.pressingLeft = false;
			player.pressingUp = false;
			player.pressingAttack = false;
		}
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
		Player.list[i].update();
		pack.push(Player.list[i].getUpdatePack());
	}
	return pack;
}


Bullet = function(parent,angle){
	var self = Entity();
	self.id = Math.random();
	self.vel = Vector2.Polar(250 / fps, angle);
	self.parent = parent;
	self.timer = 0;
	self.toRemove = false;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();

		if(self.isPositionWall(self.pos))
			self.toRemove = true;

		for(var i in Player.list){
			var p = Player.list[i];
			if(self.pos.dist(p.pos) < 32 && self.parent !== p.id){
				p.hp -= 1;

				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.score += 1;
						shooter.xp += 3;
					p.respawn();
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

Base = function(){
	self = Entity();
	self.hp = 1000;
	self.destroyed = false;

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

	return self;

}

Tower = function(){
	self = Entity();
	self.hp = 500;
	self.destroyed = false;

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

	return self;

}
