Map = require('./simplemap.json');

Map.getTileAtPos = function(pos) {
    return Map.tiles.tileAt(Math.floor(pos.x / tileWidth), Math.floor(pos.y / tileHeight));
}
