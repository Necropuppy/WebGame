// Vector2.add(vec1, vec2) does not modify vec1 or vec2.
Vector2 = function (x, y) {
    var self = {
        x: x,
        y: y
    }

    self.mag = function() {
        return Math.sqrt(Math.pow(self.x,2)+Math.pow(self.y,2));
    }

    self.dist = function(vec) {
        return Vector2.sub(Vector2.abs(self), Vector2.abs(vec)).mag();
    }
    return self;
}

Vector2.abs = function(vec) {
    return Vector2(Math.abs(vec.x), Math.abs(vec.y));
}
Vector2.add = function(vec1, vec2) {
    return Vector2(vec1.x + vec2.x, vec1.y + vec2.y);
}

Vector2.sub = function(vec1, vec2) {
    return Vector2(vec1.x - vec2.x, vec1.x - vec2.y);
}

Vector2.neg = function(vec) {
    return Vector2(-vec.x, -vec.y);
}

Vector2.Polar = function (mag, angle) {
    return Vector2(Math.cos(angle/180*Math.PI) * mag, Math.sin(angle/180*Math.PI) * mag);
}

Vector2.Random = function (x, y) {
    return Vector2(Math.random() * x, Math.random() * y);
}
