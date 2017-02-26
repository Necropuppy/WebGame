var tmx = require('tmx-parser');
// Map object constructor
Map = {}

tmx.parseFile('./simplemap.tmx', function (err, map) {
    Map = {
        tiles: map.layers[0],
        tileWidth: map.tileWidth,
        tileHeight: map.tileHeight,
        width: map.width,
        height: map.height
    }
});

Map.getTileAtPos(pos) {
    return Map.tiles.tileAt(Math.floor(pos.x / tileWidth), Math.floor(pos.y / tileHeight);
}
