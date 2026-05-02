/* ===================== */
/* 📱 DEVICE SELECT */
/* ===================== */
let isMobile = false;

function setDevice(type){
    isMobile = (type === "mobile");
    document.getElementById("deviceScreen").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
}

/* ===================== */
/* 🔗 ELEMENTS */
/* ===================== */
const menu = document.getElementById("menu");
const gameSelect = document.getElementById("gameSelect");
const snakePage = document.getElementById("snakePage");
const guessPage = document.getElementById("guessPage");

const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");

const guessInput = document.getElementById("guessInput");
const result = document.getElementById("result");
const attemptsEl = document.getElementById("attempts");

const gameOver = document.getElementById("gameOver");
const finalScore = document.getElementById("finalScore");
const finalTime = document.getElementById("finalTime");

/* ===================== */
/* MENU */
/* ===================== */
function openGames(){
    menu.classList.add("hidden");
    gameSelect.classList.remove("hidden");
}

function goBack(){
    location.reload();
}

/* ===================== */
/* 🐍 SNAKE */
/* ===================== */

let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let snake, food, particles;

let angle = 0;
let targetAngle = 0;
let speed = 1.5;

let gameRunning, score, time, timerInterval;
let highScore = localStorage.getItem("highScore") || 0;

/* 🎮 HOLD CONTROLS */
let turningLeft = false;
let turningRight = false;

/* 🕹️ JOYSTICK */
let joystickActive = false;
let joystickX = 0;
let joystickCenterX = 0;

const joystickBase = document.getElementById("joystickBase");
const joystickStick = document.getElementById("joystickStick");

/* START */
function startSnake(){
    gameSelect.classList.add("hidden");
    snakePage.classList.remove("hidden");

    if(isMobile){
        document.getElementById("joystickContainer").classList.remove("hidden");
    } else {
        document.getElementById("joystickContainer").classList.add("hidden");
    }

    snake = [];
    for(let i=0;i<25;i++){
        snake.push({x:200 - i*6, y:200});
    }

    particles = [];
    food = {x:100,y:100,pulse:0};

    score = 0;
    time = 0;
    gameRunning = true;

    scoreEl.innerText = "Score: 0 | High: " + highScore;
    timeEl.innerText = "Time: 0s";

    clearInterval(timerInterval);
    timerInterval = setInterval(()=>{
        time++;
        timeEl.innerText = "Time: " + time + "s";
    },1000);

    loop();
}

/* LOOP */
function loop(){
    if(!gameRunning) return;
    requestAnimationFrame(loop);
    update();
    draw();
}

/* UPDATE */
function update(){

    // HOLD TURN
    if(turningLeft) targetAngle -= 0.12;
    if(turningRight) targetAngle += 0.12;

    // JOYSTICK TURN
    if(joystickActive){
        targetAngle += joystickX * 0.002;
    }

    // smooth rotation
    let diff = targetAngle - angle;
    if(diff > Math.PI) diff -= Math.PI*2;
    if(diff < -Math.PI) diff += Math.PI*2;

    angle += diff * 0.25;

    let head = {
        x: snake[0].x + Math.cos(angle) * speed,
        y: snake[0].y + Math.sin(angle) * speed
    };

    // wall collision
    if(head.x < 0 || head.y < 0 || head.x > 400 || head.y > 400){
        endGame();
        return;
    }

    snake.unshift(head);

    let dx = head.x - food.x;
    let dy = head.y - food.y;

    // eat food
    if(Math.sqrt(dx*dx + dy*dy) < 10){

        for(let i=0;i<12;i++){
            particles.push({
                x: food.x,
                y: food.y,
                vx:(Math.random()-0.5)*4,
                vy:(Math.random()-0.5)*4,
                life:20
            });
        }

        food = {
            x: Math.random()*360+20,
            y: Math.random()*360+20,
            pulse:0
        };

        score++;

        if(score > highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        scoreEl.innerText = "Score: " + score + " | High: " + highScore;

    } else {
        snake.pop();
    }

    // particles
    particles.forEach(p=>{
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
    });

    particles = particles.filter(p=>p.life>0);

    // smooth body
    for(let i=1;i<snake.length;i++){
        let prev = snake[i-1];
        let curr = snake[i];

        let dx = prev.x - curr.x;
        let dy = prev.y - curr.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if(dist > 6){
            curr.x += dx * 0.2;
            curr.y += dy * 0.2;
        }
    }
}

/* DRAW */
function draw(){
    ctx.fillStyle = "#a8d45a";
    ctx.fillRect(0,0,400,400);

    ctx.beginPath();
    ctx.arc(food.x, food.y, 6, 0, Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.strokeStyle = "blue";

    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);

    for(let i=1;i<snake.length;i++){
        ctx.lineTo(snake[i].x, snake[i].y);
    }

    ctx.stroke();

    let head = snake[0];
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(-3,-3,2,0,Math.PI*2);
    ctx.arc(3,-3,2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "orange";
    particles.forEach(p=>{
        ctx.fillRect(p.x,p.y,3,3);
    });
}

/* 🎮 PC CONTROLS */
document.addEventListener("keydown", e=>{
    if(e.key=="a"||e.key=="ArrowLeft") turningLeft = true;
    if(e.key=="d"||e.key=="ArrowRight") turningRight = true;

    if(e.key=="w"||e.key=="ArrowUp") speed = 2.5;
    if(e.key=="s"||e.key=="ArrowDown") speed = 1;
});

document.addEventListener("keyup", e=>{
    if(e.key=="a"||e.key=="ArrowLeft") turningLeft = false;
    if(e.key=="d"||e.key=="ArrowRight") turningRight = false;

    if(e.key=="w"||e.key=="ArrowUp") speed = 1.5;
    if(e.key=="s"||e.key=="ArrowDown") speed = 1.5;
});

/* 🕹️ JOYSTICK */
if(joystickBase){

    joystickBase.addEventListener("touchstart", e=>{
        joystickActive = true;
        let rect = joystickBase.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width/2;
    });

    joystickBase.addEventListener("touchmove", e=>{
        if(!joystickActive) return;

        let touch = e.touches[0];
        let dx = touch.clientX - joystickCenterX;

        joystickX = dx;

        let limited = Math.max(-40, Math.min(40, dx));
        joystickStick.style.left = (35 + limited) + "px";
    });

    joystickBase.addEventListener("touchend", ()=>{
        joystickActive = false;
        joystickX = 0;
        joystickStick.style.left = "35px";
    });
}

/* 🖥️ FULLSCREEN */
function toggleFullscreen(){
    if(!document.fullscreenElement){
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

/* GAME OVER */
function endGame(){
    gameRunning = false;
    clearInterval(timerInterval);

    finalScore.innerText = "Score: " + score;
    finalTime.innerText = "Time: " + time + "s";

    gameOver.classList.remove("hidden");
}

function restartGame(){
    gameOver.classList.add("hidden");
    startSnake();
}

/* ===================== */
/* 🧠 GUESS */
/* ===================== */

let number, attempts;

function startGuess(){
    gameSelect.classList.add("hidden");
    guessPage.classList.remove("hidden");

    number = Math.floor(Math.random()*21);
    attempts = 0;

    attemptsEl.innerText = "Attempts: 0";
    result.innerText = "";
}

function checkGuess(){
    let val = parseInt(guessInput.value);

    if(isNaN(val)||val<0||val>20){
        result.innerText="Enter 0–20!";
        return;
    }

    attempts++;
    attemptsEl.innerText="Attempts: "+attempts;

    if(val===number) result.innerText="🎉 Correct!";
    else if(val>number) result.innerText="Too high!";
    else result.innerText="Too low!";
}
