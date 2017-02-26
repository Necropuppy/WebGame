var tmx = require('tmx-parser');
// Map object constructor
Map = function() {
    self = function (err, map) {
        self = {
            tileWidth: map.tileWidth,
            tileHeight: map.tileheight,
            width: map.width,
            height: map.height,
            tiles: map.layers[0]
        }
    }

    tmx.parseFile('./simplemap.tmx', self);
    self.getTileAt = function(pos) {
        return self.tileAt(pos.x / tileWidth, pos.y / tileHeight);
    }

    return self;
}
