var initPack = {map:[]};

var simple = require('./simplemap.json');



World = function(){
	var self = {
		rows:100,
		cols:100,
		id:"",
		tiles:[],
	}
	
	self.update = function(){
		
	}
	return self;
	
}

World.getMapUpdateData = function(){
	var pack = {
		initPack:{
			map:initPack.map,
		},
	};
	initPack.map = [];
}

Map = function(id){
	var self = World();
	self.id = id;
	var numMap = simple;
	for(var r = 0;r < self.rows;r++){
		self.tiles[r] = [];
		for(var c = 0; c<self.cols;c++){
			self.tiles[r][c] = new Tile(r,c,simple[r][c]);
		}
	}
	self.tiles = simple;
	
	
	self.getInitPack = function(){
		return {
			rows:self.rows,
			cols:self.cols,
			tiles:self.tiles,
			
		};
	}
	Map.list[id] = self;
	
	initPack.map.push(self.getInitPack());
	return self;
}
Map.list = {};


Map.onStart = function(){
	var map = Map();
	
	socket.emit('mapInit',{
		selfId:
		tiles:Map.getAllInitPack()
		})
}
Map.getAllInitPack = function(){
	var maps = [];
	for(var i in Map.list)
		maps.push(Map.list[i].getInitPack());
	return maps;
}

var Tile = function(row, col, type){
	var self = {
		row: 0,
		col: 0,
		solid: false,
		color: "rgb(90, 90, 90)",
		parent: 'none',
		changed: false,
		width:32,
		height:32,
	}
	self.row = row;
	self.col = col;
	if(type === 1){
		self.solid = true;
	}
	self.color = "rgb(Math.random(10) + 85, Math.random(10) + 85,Math.random(10) + 85)"; 
	
	
	
}

Tile.changeColor = function(r,g,b){
		self.color = "rgb(r,g,b)";
	}
	

Tile.update = function(){
	
}
