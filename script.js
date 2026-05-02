/* ===================== */
/* FIX ELEMENT REFERENCES */
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

/* MENU */
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
let angle=0, targetAngle=0, speed=2;
let gameRunning, score, time, timerInterval;
let highScore = localStorage.getItem("highScore") || 0;

function startSnake(){
    gameSelect.classList.add("hidden");
    snakePage.classList.remove("hidden");

    snake = [];
    for(let i=0;i<25;i++){
        snake.push({x:200 - i*6, y:200});
    }

    particles = [];
    food = {x:100,y:100,pulse:0};

    score = 0;
    time = 0;
    gameRunning = true;

    scoreEl.innerText="Score: 0 | High: " + highScore;
    timeEl.innerText="Time: 0s";

    clearInterval(timerInterval);
    timerInterval = setInterval(()=>{
        time++;
        timeEl.innerText="Time: "+time+"s";
    },1000);

    loop();
}

function loop(){
    if(!gameRunning) return;
    requestAnimationFrame(loop);
    update();
    draw();
}

function update(){
    let diff = targetAngle - angle;
    if(diff > Math.PI) diff -= Math.PI*2;
    if(diff < -Math.PI) diff += Math.PI*2;
    angle += diff * 0.08;

    let head = {
        x: snake[0].x + Math.cos(angle)*speed,
        y: snake[0].y + Math.sin(angle)*speed
    };

    if(head.x<0||head.y<0||head.x>400||head.y>400){
        endGame();
        return;
    }

    for(let i=10;i<snake.length;i++){
        let dx = head.x - snake[i].x;
        let dy = head.y - snake[i].y;
        if(Math.sqrt(dx*dx + dy*dy) < 6){
            endGame();
            return;
        }
    }

    snake.unshift(head);

    let dxF = head.x - food.x;
    let dyF = head.y - food.y;

    if(Math.sqrt(dxF*dxF + dyF*dyF) < 12){

        // 🍎 particles
        for(let i=0;i<15;i++){
            particles.push({
                x: food.x,
                y: food.y,
                vx:(Math.random()-0.5)*4,
                vy:(Math.random()-0.5)*4,
                life:20
            });
        }

        food = {
            x:Math.random()*360+20,
            y:Math.random()*360+20,
            pulse:0
        };

        score++;

        if(score > highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        scoreEl.innerText="Score: "+score+" | High: "+highScore;

    } else {
        snake.pop();
    }

    food.pulse += 0.1;

    particles.forEach(p=>{
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;
    });

    particles = particles.filter(p=>p.life>0);

    for(let i=1;i<snake.length;i++){
        let prev=snake[i-1], curr=snake[i];
        let dx=prev.x-curr.x, dy=prev.y-curr.y;
        let dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>6){
            curr.x+=dx*0.2;
            curr.y+=dy*0.2;
        }
    }
}

function draw(){
    ctx.fillStyle="#a8d45a";
    ctx.fillRect(0,0,400,400);

    let size=6+Math.sin(food.pulse)*2;
    ctx.beginPath();
    ctx.arc(food.x,food.y,size,0,Math.PI*2);
    ctx.fillStyle="red";
    ctx.fill();

    ctx.lineWidth=12;
    ctx.lineCap="round";

    let grad=ctx.createLinearGradient(0,0,400,0);
    grad.addColorStop(0,"red");
    grad.addColorStop(0.5,"yellow");
    grad.addColorStop(1,"blue");

    ctx.strokeStyle=grad;
    ctx.beginPath();
    ctx.moveTo(snake[0].x,snake[0].y);

    for(let i=1;i<snake.length;i++){
        ctx.lineTo(snake[i].x,snake[i].y);
    }
    ctx.stroke();

    let head=snake[0];
    ctx.save();
    ctx.translate(head.x,head.y);
    ctx.rotate(angle);
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.arc(-3,-3,2,0,Math.PI*2);
    ctx.arc(3,-3,2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle="orange";
    particles.forEach(p=>{
        ctx.fillRect(p.x,p.y,3,3);
    });
}

/* CONTROLS */
document.addEventListener("keydown", e=>{
    if(e.key=="w"||e.key=="ArrowUp") targetAngle=-Math.PI/2;
    if(e.key=="s"||e.key=="ArrowDown") targetAngle=Math.PI/2;
    if(e.key=="a"||e.key=="ArrowLeft") targetAngle=Math.PI;
    if(e.key=="d"||e.key=="ArrowRight") targetAngle=0;
});

/* GAME OVER */
function endGame(){
    gameRunning=false;
    clearInterval(timerInterval);

    finalScore.innerText="Score: "+score;
    finalTime.innerText="Time: "+time+"s";

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

    number=Math.floor(Math.random()*21);
    attempts=0;

    attemptsEl.innerText="Attempts: 0";
    result.innerText="";
}

function checkGuess(){
    let val=parseInt(guessInput.value);

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
