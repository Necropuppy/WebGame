// Map object constructor
// tiles is a 2D array of ints representing the tile type
Map = function(tiles) {
    var self = {
        tileSize: 32,   // Side length of tiles in px
        tiles: tiles    // 2D Array of tiles contained in the map
    }

    return self;
}
