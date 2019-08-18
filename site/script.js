var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d")

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

var x = canvas.width/2;
var y = canvas.height-30;

var dx = 0;
var dy = 0;
var ballRadius = 10;
var ballDefaultSpeed = 2;
var haveCookie = false;
var cookiePosX = 0;
var cookiePosY = 0;
var cookieRadius = 5;

function setUpSpeed(value) {
    dy = -value;
}

function setDownSpeed(value) {
    dy = value;
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
            setUpSpeed(2);
            break;
        case "s":
            setDownSpeed(2);
            break;
        case "a":
            setLeftSpeed(2);
            break;
        case "d":
            setRightSpeed(2);
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function distance(ax, ay, bx, by) {
    return Math.sqrt((bx-ax)**2 + (by-ay)**2);
}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawCookie() {
    if (!haveCookie) {
        return;
    }
    ctx.beginPath();
    ctx.arc(cookiePosX, cookiePosY, cookieRadius, 0, Math.PI*2);
    ctx.fillStyle = "#FAD201"
    ctx.fill();
    ctx.closePath();
}

function draw() {
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawBall(x, y);
    drawCookie();

}

function generateCookie() {
    if (haveCookie) {
        return;
    }
    cookiePosX = getRandomInt(0, canvas.width);
    cookiePosY = getRandomInt(0, canvas.height);
    haveCookie = true;
}

function moveObjects() {
    x += dx;
    y += dy;
    if (y - ballRadius < 0 || y + ballRadius > canvas.height) {
        y -= dy;
    }
    if (x - ballRadius < 0 || x + ballRadius > canvas.width) {
        x -= dx;
    }
    if (distance(x, y, cookiePosX, cookiePosY) < ballRadius) {
        haveCookie = false;
        ballRadius += 1;
    }
}

function gameLoop() {
    generateCookie();
    moveObjects();
    draw();
}

setInterval(gameLoop, 10);
