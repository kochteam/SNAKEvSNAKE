var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");

var desiredFps = 240;
var winWidth = window.innerWidth * 0.9;
var winHeight = window.innerHeight * 0.9;
var topLeftCorner = canvas.getBoundingClientRect();

ctx.canvas.width = winWidth;
ctx.canvas.height = winHeight;
var defaultPosX = winWidth / 2;
var defaultPosY = winHeight / 2;
var defaultDirX = 1;
var defaultDirY = 0;
var defaultColor = "grey";  //grey
var cookieDefaultColor = "orange"; //yellow
var obstacleDefaultColor = "red"; //red
var projectileDefaultColor = "red"; //red
var defaultGunColor = "black";
var defaultSize = 25;
var defaultProjectileSize = 5;
var defaultGunLength = 20;
var defaultGunPower = defaultProjectileSize;
var defaultSpeed = 0;
var defaultGunProjectileSpeed = 400;
var maxForwardSpeed = 200;
var minForwardSpeed = -100;
var inputDefaultSpeed = 200;
var inputDefaultRotation = 1.5;
var defaultGunRotationSpeed = 2;
var deccelerateCoeff = 2 * maxForwardSpeed;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("mousedown", mouseDownHandler);

function vector(x, y) {
    this.x = x;
    this.y = y;
    this.add = function(vec) {
        return new vector(this.x + vec.x, this.y + vec.y);
    }
    this.sub = function(vec) {
        return new vector(this.x - vec.x, this.y - vec.y);
    }
    this.neg = function() {
        return new vector(-this.x, -this.y);
    }
    this.mul = function(num) {
        return new vector(this.x * num, this.y * num);
    }
    this.len = function() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
    this.normalize = function() {
        return new vector(this.x / this.len(), this.y / this.len());
    }
    this.rotate = function(rads) {
        return new vector(this.x * Math.cos(rads) - this.y * Math.sin(rads),
                          this.x * Math.sin(rads) + this.y * Math.cos(rads));
    }
}

function drawCircle(pos, radius, color) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function drawLine(pos1, pos2, color) {
    ctx.beginPath();
    ctx.moveTo(pos1.x, pos1.y);
    ctx.lineTo(pos2.x, pos2.y);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.closePath();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomVector(leftUpper, rightLower) {
    return new vector(getRandomInt(leftUpper.x, rightLower.x), getRandomInt(leftUpper.y, rightLower.y));
}

var leftUpper = new vector(0, 0);
var rightLower = new vector(winWidth, winHeight);

function getRandomPos() {
    return getRandomVector(leftUpper, rightLower);
}

function bounceOnCollision(ship) {
    // not perfect. First move back, then decelerate.
    ship.move(-1/desiredFps);
    ship.forwardSpeed = Math.max(minForwardSpeed, -ship.forwardSpeed);
}

function stayStill(deltaTIme) {
    return;
}

function circularObstacle(pos, size) {
    this.pos = pos;
    this.size = size;
    this.color = obstacleDefaultColor;

    this.draw = function() {
        drawCircle(this.pos, this.size, this.color);
    }

    this.checkCollision = function(pos, radius) {
        return this.pos.sub(pos).len() < this.size + radius;
    }

    this.actOnCollision = bounceOnCollision;
    this.move = stayStill;
}

function lineObstacle(pos, dir, width) {
    this.pos = pos;
    this.dir = dir;
    this.width = width;
    this.color = obstacleDefaultColor;

    this.draw = function() {
        drawLine(this.pos.sub(this.dir), this.pos.add(this.dir), this.color);
    }

    this.checkCollision = function(pos, radius) {
        return (this.dir.x > 0) && (Math.abs(this.pos.y - pos.y) < radius + this.width) && (Math.abs(this.pos.x - pos.x) < this.dir.x) ||
               (this.dir.y > 0) && (Math.abs(this.pos.x - pos.x) < radius + this.width) && (Math.abs(this.pos.y - pos.y) < this.dir.y);
    }

    this.actOnCollision = bounceOnCollision;
    this.move = stayStill;
}

function worldBorder() {
    this.color = obstacleDefaultColor;
    this.wallList = [
        new lineObstacle(new vector(winWidth-1, winHeight-1), new vector(0, winHeight), 10),
        new lineObstacle(new vector(1, winHeight-1), new vector(0, winHeight), 10),
        new lineObstacle(new vector(1, 1), new vector(winWidth, 0), 10),
        new lineObstacle(new vector(1, winHeight-1), new vector(winWidth, 0), 10)];

    this.draw = function() {
        this.wallList.forEach(function(obj, idx, array) {
            obj.draw();
        });
    }

    this.checkCollision = function(pos, radius) {
        var ret = false;
        this.wallList.forEach(function(obj, idx, array) {
            ret = ret | obj.checkCollision(pos, radius);
        });
        return ret;
    }

    this.actOnCollision = bounceOnCollision;
    this.move = stayStill;
}

function projectile(power, speed, dir, pos) {
    this.power = power;
    this.speed = speed;
    this.dir = new vector(dir.x, dir.y);
    this.pos = new vector(pos.x, pos.y);
    this.color = projectileDefaultColor;

    this.draw = function() {
        drawCircle(this.pos, defaultProjectileSize, this.color);
    }

    this.move = function(deltaTime) {
        this.pos = this.pos.add(this.dir.mul(this.speed * deltaTime));
    }

    this.checkCollision = function(pos, radius) {
        return this.pos.sub(pos).len() < this.size + radius;
    }

    this.actOnCollision = function(ship) {

    }
}

function emitProjectile(power, speed, dir, pos) {
    var prj = new projectile(power, speed, dir, pos);
    objectList.push(prj);
}

function basicGun(pos) {
    this.projectilePower = defaultGunPower;
    this.projectileSpeed = defaultGunProjectileSpeed;
    this.dir = new vector(defaultDirX, defaultDirY);
    this.dir.normalize();
    this.rotationSpeed = defaultGunRotationSpeed;
    this.pos = pos;
    this.length = defaultGunLength;

    this.shoot = function() {
        emitProjectile(this.projectilePower, this.projectileSpeed, this.dir, this.pos);
    }

    this.rotateTo = function(dest, deltaTime) {
        destVec = dest.sub(this.pos).normalize();
        var rotateLeft = destVec.x*this.dir.y - destVec.y*this.dir.x < 0;
        this.dir = this.dir.rotate((rotateLeft ? this.rotationSpeed : -this.rotationSpeed) * deltaTime);
    }

    this.followPos = function(pos) {
        this.pos = pos;
    }

    this.draw = function() {
        drawLine(this.pos, this.pos.add(this.dir.mul(this.length)), defaultGunColor);
    }
}

function basicShip() {
    this.pos = new vector(defaultPosX, defaultPosY);
    this.dir = new vector(defaultDirX, defaultDirY);
    this.dir.normalize();
    this.color = defaultColor;
    this.forwardSpeed = defaultSpeed;
    this.size = defaultSize;
    this.gun = new basicGun(this.pos);

    this.accelerate = function(deltaTime) {
        this.forwardSpeed += dy * deltaTime;
        this.forwardSpeed -= Math.sign(this.forwardSpeed) * (this.forwardSpeed / maxForwardSpeed) ** 2 * deccelerateCoeff * deltaTime;
        if (this.forwardSpeed > maxForwardSpeed) {
            this.forwardSpeed = maxForwardSpeed;
        } else if (this.forwardSpeed < minForwardSpeed) {
            this.forwardSpeed = minForwardSpeed;
        }
        var coeffitient = this.forwardSpeed / maxForwardSpeed;
        this.dir = this.dir.rotate(dx * deltaTime * coeffitient);
    }

    this.move = function(deltaTime) {
        this.accelerate(deltaTime);
        this.pos = this.pos.add(this.dir.mul(this.forwardSpeed * deltaTime));
        this.gun.followPos(this.pos);
        this.gun.rotateTo(clientMousePos, deltaTime);
    }

    this.shoot = function() {
        this.gun.shoot();
    }

    this.eat = function(deltaSize) {
        this.size += deltaSize;
    }

    this.draw = function() {
        drawCircle(this.pos.add(this.dir.mul(this.size)), this.size * 0.7, this.color);
        drawCircle(this.pos, this.size, this.color);
        drawCircle(this.pos.sub(this.dir.mul(this.size)), this.size * 0.8, this.color);
        this.gun.draw();
    }
    this.checkCollision = function(pos, size) {
        return false;
    }
}

function cookie() {
    this.respawn = function() {
        if (haveCookie) {
            return;
        }
        this.pos = new vector(getRandomInt(10, canvas.width - 10), getRandomInt(10, canvas.height - 10));
        this.size = getRandomInt(1, 3);
        this.color = cookieDefaultColor;
        haveCookie = true;
    }

    this.die = function() {
        haveCookie = false;
    }

    this.draw = function() {
          if (!haveCookie) {
              return;
          }
          drawCircle(this.pos, this.size * 5, this.color);
    }

    this.checkCollision = function(pos, radius) {
        return this.pos.sub(pos).len() < this.size + radius;
    }

    this.actOnCollision = function(ship) {
        this.die();
        ship.eat(this.size);
    }
    this.move = stayStill;
}

var cookieSingleton = new cookie();
var playerShip = new basicShip();
var objectList = [new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new lineObstacle(getRandomPos(), new vector(getRandomInt (50, 100), 0), 10),
                  new lineObstacle(getRandomPos(), new vector(0, getRandomInt(50, 100)), 10),
                  new worldBorder(),
                  playerShip,
                  cookieSingleton];

var haveCookie = false;
var dx = 0;
var dy = 0;

var clientMousePos = new vector(defaultPosX, defaultPosY);

function setUpSpeed(value) {
    dy = value;
}

function setDownSpeed(value) {
    dy = -value;
}

function setLeftSpeed(value) {
    dx = -value;
}

function setRightSpeed(value) {
    dx = value;
}

function processShotInput() {
    playerShip.shoot();
}

function keyDownHandler(event) {
    switch (event.key) {
        case "w":
            setUpSpeed(inputDefaultSpeed);
            break;
        case "s":
            setDownSpeed(inputDefaultSpeed);
            break;
        case "a":
            setLeftSpeed(inputDefaultRotation);
            break;
        case "d":
            setRightSpeed(inputDefaultRotation);
            break;
        case "space":
            processShotInput();
    }
}

function keyUpHandler(event) {
    switch (event.key) {
        case "w":
            setUpSpeed(0);
            break;
        case "s":
            setDownSpeed(0);
            break;
        case "a":
            setLeftSpeed(0);
            break;
        case "d":
            setRightSpeed(0);
            break;
    }
}

function mouseMoveHandler(event) {
    clientMousePos.x = /*(event.clientX - topLeftCorner.left) / (topLeftCorner.right - topLeftCorner.left) * canvas.width*/event.offsetX;
    clientMousePos.y = /*(event.clientY - topLeftCorner.top) / (topLeftCorner.bottom - topLeftCorner.top) * canvas.height*/event.offsetY;
}

function mouseDownHandler(event) {
    processShotInput();
}

function drawGui(pts) {
    str = "Points: ".concat(pts);
    ctx.font = "60 px";
    ctx.fillStyle = "black"
    ctx.fillText(str, 10, 10);
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    playerShip.draw();
    cookieSingleton.draw();
    objectList.forEach(function(obj, idx, array) {
        obj.draw();
    });
    drawGui(playerShip.size - defaultSize);
}

function moveObjects() {
    cookieSingleton.respawn();
    objectList.forEach(function(obj, idx, array) {
        obj.move(1/desiredFps);
    });
    objectList.forEach(function(obj, idx, array) {
        if (obj.checkCollision(playerShip.pos, playerShip.size)) {
            obj.actOnCollision(playerShip);
        }
    });
}

function gameLoop() {
    moveObjects();
    draw();
}

setInterval(gameLoop, 1000 / desiredFps);
