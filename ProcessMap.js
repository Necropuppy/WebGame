var tmx = require("tmx-parser");
tmx.parseFile('simplemap.tmx', function (err, data) {
    console.log(data.layers[0]);
});
