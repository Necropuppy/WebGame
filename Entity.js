var initPack = {player:[],bullet:[],tower:[],base:[],minion:[]};
var removePack = {player:[],bullet:[],minion:[]};
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
		if (pt && pt.x && pt.y) {
			return simple[Math.abs(Math.floor(pt.y / 64) % simple.length)][Math.abs(Math.floor(pt.x / 64) % simple[0].length)];
		}
	}
	return self;
}

Entity.getFrameUpdateData = function(){
	var pack = {
		initPack:{
			player:initPack.player,
			bullet:initPack.bullet,
			tower:initPack.tower,
			base:initPack.base,
			minion:initPack.minion,
		},
		removePack:{
			player:removePack.player,
			bullet:removePack.bullet,
			minion:removePack.minion,
		},
		updatePack:{
			player:Player.update(),
			bullet:Bullet.update(),
			tower:Tower.update(),
			base:Base.update(),
			minion:Minion.update(),
		}
	};
	initPack.player = [];
	initPack.bullet = [];
	initPack.tower = [];
	initPack.base = [];
	initPack.minion = [];
	removePack.player = [];
	removePack.bullet = [];
	removePack.minion = [];
	return pack;
}

Player = function(id, username,team){
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
	self.lvl = 1;
	self.lvlPts = 0;
	self.team = team;

	var super_update = self.update;
	self.update = function(){
		self.updateSpd();
		super_update();


		//mana regen

		if(self.mp < self.mpMax){
			self.mp +=1;
		}

		//update xp -- level up!
		if(self.xp >= self.xpMax){
			self.xp = self.xp - self.xpMax;
			//self.xpMax *= 2;
			self.lvl += 1;
			self.lvlPts += 1;
		}

		if(self.pressingAttack){
			self.shootBullet(self.mouseAngle);
		}
	}

	self.shootBullet = function(angle){
		if(self.mp >= 10){
			var b = Bullet(self,angle);
			b.pos = self.pos;
			self.mp -= 10;
		}
	}

	self.updateSpd = function(){
		if(self.pressingRight && !self.isPositionWall(Vector2.add(Vector2.add(self.pos, Vector2(0, 24)), Vector2(self.maxSpd, 0))))
			self.vel.x = self.maxSpd;
		else if(self.pressingLeft && !self.isPositionWall(Vector2.add(Vector2.add(self.pos, Vector2(0, 24)), Vector2(-self.maxSpd, 0))))
			self.vel.x = -self.maxSpd;
		else
			self.vel.x = 0;

		if(self.pressingUp && !self.isPositionWall(Vector2.add(Vector2.add(self.pos, Vector2(0, 24)), Vector2(0, -self.maxSpd))))
			self.vel.y = -self.maxSpd;
		else if(self.pressingDown && !self.isPositionWall(Vector2.add(Vector2.add(self.pos, Vector2(0, 24)), Vector2(0, self.maxSpd))))
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
			lvl:self.lvl,
			lvlPts:self.lvlPts,
			team:self.team,
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
			lvl:self.lvl,
			lvlPts:self.lvlPts,
		}
	}

	Player.list[id] = self;

	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};
Player.onConnect = function(socket, username, team){
	var player = Player(socket.id, username, team);
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
		tower:Tower.getAllInitPack(),
		base:Base.getAllInitPack(),
		minion:Minion.getAllInitPack(),
	});
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

Minion = function(base, waypoints){
	var self = Entity();
	self.pos = base.pos;
	self.id = Math.random();
	self.team = base.team;
	self.waypoints = waypoints;
	self.toRemove = false;
	self.maxSpd = 2;
	self.waypoint = 0;
	self.hp = 10;
	var super_update = self.update;
	self.update = function() {
		self.updateSpd();
		super_update();
		if (self.hp <= 0) {
			self.toRemove = true;
		}
	}

	self.updateSpd = function() {
		if (self.waypoint < self.waypoints.length) {
			if (self.pos.dist(self.waypoints[self.waypoint]) < 32) self.waypoint++;

			var diff = Vector2.sub(self.waypoints[self.waypoint], self.pos);
			diff = Vector2.unit(diff);

			self.vel = Vector2.mult(diff, self.maxSpd);
		} else {
			self.vel = Vector2(0,0);
		}

		for (var i in Minion.list) {
			var m = Minion.list[i];
			if (self.pos.dist(m.pos) < 64 && self.team !== m.team) {
				self.vel = Vector2(0,0);
				self.shootBullet(m.pos);
				return;
			}
		}

		for (var i in Tower.list) {
			var t = Tower.list[i];
			if (self.pos.dist(t.pos) < 96 && self.team !== t.team) {
				self.vel = Vector2(0,0);
				self.shootBullet(t.pos);
				return;
			}
		}

		for (var i in Base.list) {
			var b = Base.list[i];
			if (self.pos.dist(b.pos) < 96 && self.team !== b.team) {
				self.vel = Vector2(0,0);
				self.shootBullet(b.pos);
				return;
			}
		}

		for (var i in Player.list) {
			var p = Player.list[i];
			if (self.pos.dist(p.pos) < 32 && self.team !== p.team) {
				self.vel = Vector2(0,0);
				return;
			}
		}
	}

	self.shootBullet = function(pt) {
		var b = Bullet(self, 180 * (1 / Math.PI) * Vector2.angle(Vector2.sub(pt, self.pos)));
		b.pos = self.pos;
	}

	self.getInitPack = function() {
		return {
			id: self.id,
			x: self.pos.x,
			y: self.pos.y,
			hp: self.hp,
			team: self.team,
		}
	}

	self.getUpdatePack = function() {
		return {
			id: self.id,
			x: self.pos.x,
			y: self.pos.y,
			hp: self.hp,
		}
	}

	Minion.list[self.id] = self;
	initPack.minion.push(self.getInitPack());
	return self;
}

Minion.list = {};

Minion.getAllInitPack = function(){
	var minions = [];
	for(var i in Minion.list)
		minions.push(Minion.list[i].getInitPack());
	return minions;
}

Minion.update = function(){
	var pack = [];
	for(var i in Minion.list){
		var m = Minion.list[i];
		m.update();
		if(m.toRemove){
			delete Minion.list[i];
			removePack.Minion.push(m.id);
		} else
			pack.push(m.getUpdatePack());
	}
	return pack;
}

Bullet = function(parent,angle){
	var self = Entity();
	self.pos = parent.pos;
	self.id = Math.random();
	self.vel = Vector2.Polar(250 / fps, angle);
	self.actuallyParent = parent;
	self.parent = parent.id;
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
			if(self.pos.dist(p.pos) < 32 && self.parent !== p.id && self.actuallyParent.team !== p.team){
				p.hp -= 1;

				if(p.hp <= 0){
					var shooter = Player.list[self.parent];
					if(shooter) {
						shooter.score += 1;
						shooter.xp += 3;
					}
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

Base = function(team,id){
	var self = Entity();
	self.hp = 1000;
	self.destroyed = false;

	self.team = team;
	self.id = id;
	if(team === 0){
		self.pos = Vector2(350, 1920 - 540);
	} else if(team === 1){
		self.pos = Vector2(1920 - 540, 350);
	}
	if (team === 0) {
		Minion(self, [Vector2(600, 1920 - 700), Vector2(1920 - 700, 600), Vector2(1920 - 540, 350)]);
	} else {
		Minion(self, [Vector2(1920-700, 600), Vector2(600, 1920 - 700), Vector2(350, 1920 - 540)]);
	}

	self.update = function(){
		if(self.hp <= 0){
			self.hp = 0;
			self.destroyed = true;
		}
	}


	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			hp:self.hp,
			destroyed:self.destroyed,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			hp:self.hp,
			destroyed:self.destroyed,
		};
	}

	Base.list[id] = self;
	initPack.base.push(self.getInitPack());
	return self;
}

Base.list = {};

Base.getAllInitPack = function(){
	var bases = [];
	for(var i in Base.list)
		bases.push(Base.list[i].getInitPack());
	return bases;
}

Base.update = function(){
	var pack = [];
	for(var i in Base.list){
		Base.list[i].update();
		pack.push(Base.list[i].getUpdatePack());
	}
	return pack;
}

Base.onStart = function(){
	var base = Base(0,0);
	var base2 = Base(1,1);
}

Tower = function(team, id){
	var self = Entity();
	self.hp = 500;
	self.destroyed = false;
	self.team = team;
	self.id = id;
	if(self.team === 0){
		self.pos = Vector2(600,1920 - 700);

	} else if(self.team === 1){
		self.pos = Vector2(1920 - 700,600);
	}

	self.update = function(){
		if(self.hp <= 0){
			self.hp = 0;
			self.destroyed = true;
		}
	}


	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			hp:self.hp,
			destroyed:self.destroyed,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.pos.x,
			y:self.pos.y,
			hp:self.hp,
			destroyed:self.destroyed,
		};
	}
	Tower.list[self.id] = self;
	initPack.tower.push(self.getInitPack());
	return self;
}

Tower.getAllInitPack = function(){
	var towers = [];
	for(var i in Tower.list)
		towers.push(Tower.list[i].getInitPack());
	return towers;
}

Tower.update = function(){
	var pack = [];
	for(var i in Tower.list){
		Tower.list[i].update();
		pack.push(Tower.list[i].getUpdatePack());
	}
	return pack;
}

Tower.list = {};

Tower.onStart = function(){
	Tower(0,0);
	Tower(1,1);

}
