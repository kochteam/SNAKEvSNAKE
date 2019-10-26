var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");

var desiredFps = 60;
var winWidth = window.innerWidth * 0.9;
var winHeight = window.innerHeight * 0.9;


ctx.canvas.width = winWidth;
ctx.canvas.height = winHeight;
var defaultPosX = winWidth / 2;
var defaultPosY = winHeight / 2;
var defaultDirX = 1;
var defaultDirY = 0;
var defaultColor = "grey";  //grey
var cookieDefaultColor = "orange"; //yellow
var obstacleDefaultColor = "red" //red
var defaultSize = 25;
var defaultSpeed = 0;
var maxForwardSpeed = 200;
var minForwardSpeed = -100;
var inputDefaultSpeed = 200;
var inputDefaultRotation = 1;

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

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

function drawLine(pos1, pos2) {
    ctx.beginPath();
    ctx.moveTo(pos1.x, pos1.y);
    ctx.lineTo(pos2.x, pos2.y);
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
}


function basicShip() {
    this.pos = new vector(defaultPosX, defaultPosY);
    this.dir = new vector(defaultDirX, defaultDirY);
    this.dir.normalize();
    this.color = defaultColor;
    this.forwardSpeed = defaultSpeed;
    this.size = defaultSize;

    this.accelerate = function(deltaTime) {
        this.forwardSpeed += dy * deltaTime;
        if (this.forwardSpeed > maxForwardSpeed) {
            this.forwardSpeed = maxForwardSpeed;
        } else if (this.forwardSpeed < minForwardSpeed) {
            this.forwardSpeed = minForwardSpeed;
        }
        this.dir = this.dir.rotate(dx * deltaTime);
    }
    this.move = function(deltaTime) {
        this.accelerate(deltaTime);
        this.pos = this.pos.add(this.dir.mul(this.forwardSpeed * deltaTime));
    }
    this.eat = function(deltaSize) {
        this.size += deltaSize;
    }
    this.draw = function() {
        drawCircle(this.pos.add(this.dir.mul(this.size)), this.size * 0.7, this.color);
        drawCircle(this.pos, this.size, this.color);
        drawCircle(this.pos.sub(this.dir.mul(this.size)), this.size * 0.8, this.color);
    }
}

function cookie() {
    this.respawn = function() {
        if (haveCookie) {
            return;
        }
        this.pos = new vector(getRandomInt(0, canvas.width), getRandomInt(0, canvas.height));
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
}

var objectList = [new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new circularObstacle(getRandomPos(), getRandomInt(10, 20)),
                  new lineObstacle(getRandomPos(), new vector(getRandomInt (50, 100), 0), 10),
                  new lineObstacle(getRandomPos(), new vector(0, getRandomInt(50, 100)), 10)]
var playerShip = new basicShip();
var haveCookie = false;
var cookieSingleton = new cookie();
var dx = 0;
var dy = 0;

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

function drawGui(pts) {
    str = "Points: ".concat(pts);
    ctx.font = "30 px";7
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
    playerShip.move(1/desiredFps);
    if(playerShip.pos.sub(cookieSingleton.pos).len() < playerShip.size + cookieSingleton.size) {
        playerShip.eat(cookieSingleton.size);
        cookieSingleton.die();
    }
    objectList.forEach(function(obj, idx, array) {
        if (obj.checkCollision(playerShip.pos, playerShip.size)) {
            if (playerShip.size > 5) {
                playerShip.size -= 5;
            } else {
                playerShip.size = 1;
            }
        }
    });
}

function gameLoop() {
    moveObjects();
    draw();
}

setInterval(gameLoop, 1000 / desiredFps);
