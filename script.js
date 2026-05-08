/* ============================================================ */
/* 🔧 SUPABASE SETUP                                            */
/* ⚠️  REPLACE these two values with your own from Supabase!   */
/*    Dashboard → Project Settings → API                        */
/* ============================================================ */
const SUPABASE_URL  = "https://YOUR_PROJECT.supabase.co";   // ← CHANGE THIS
const SUPABASE_KEY  = "YOUR_ANON_PUBLIC_KEY";               // ← CHANGE THIS

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================================ */
/* 👤 USERNAME                                                  */
/* ============================================================ */
let currentUsername = localStorage.getItem("gameHubUsername") || null;

function saveUsername(){
    const val = document.getElementById("usernameInput").value.trim();
    if(!val || val.length < 2){
        document.getElementById("usernameError").innerText = "Name must be at least 2 characters!";
        return;
    }
    currentUsername = val;
    localStorage.setItem("gameHubUsername", val);
    document.getElementById("usernamePage").classList.add("hidden");
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("displayUsername").innerText = currentUsername;
}

/* ============================================================ */
/* 📱 DEVICE SELECT                                             */
/* ============================================================ */
let isMobile = false;

function setDevice(type){
    isMobile = (type === "mobile");
    document.getElementById("deviceScreen").classList.add("hidden");

    // If username already saved, go straight to menu
    if(currentUsername){
        document.getElementById("menu").classList.remove("hidden");
        document.getElementById("displayUsername").innerText = currentUsername;
    } else {
        document.getElementById("usernamePage").classList.remove("hidden");
    }
}

/* ============================================================ */
/* 🔗 ELEMENTS                                                  */
/* ============================================================ */
const menu           = document.getElementById("menu");
const gameSelect     = document.getElementById("gameSelect");
const snakePage      = document.getElementById("snakePage");
const guessPage      = document.getElementById("guessPage");
const leaderboardPage= document.getElementById("leaderboardPage");

const scoreEl        = document.getElementById("score");
const timeEl         = document.getElementById("time");

const guessInput     = document.getElementById("guessInput");
const result         = document.getElementById("result");
const attemptsEl     = document.getElementById("attempts");

const gameOver       = document.getElementById("gameOver");
const finalScore     = document.getElementById("finalScore");
const finalTime      = document.getElementById("finalTime");

/* ============================================================ */
/* 🗺️ MENU NAVIGATION                                           */
/* ============================================================ */
function openGames(){
    menu.classList.add("hidden");
    gameSelect.classList.remove("hidden");
}

function openLeaderboard(){
    menu.classList.add("hidden");
    leaderboardPage.classList.remove("hidden");
    loadLeaderboard("global");
}

function goBack(){
    location.reload();
}

/* ============================================================ */
/* 🏆 LEADERBOARD                                               */
/* ============================================================ */
let currentTab = "global";

function switchTab(tab){
    currentTab = tab;

    // Update tab button styles
    document.querySelectorAll(".lb-tab").forEach(btn => btn.classList.remove("active"));
    event.target.classList.add("active");

    loadLeaderboard(tab);
}

async function loadLeaderboard(tab){
    const lbLoading = document.getElementById("lbLoading");
    const lbTable   = document.getElementById("lbTable");

    lbLoading.classList.remove("hidden");
    lbTable.classList.add("hidden");

    try {
        let query = db
            .from("scores")
            .select("username, game, score, time_secs, created_at")
            .order("score", { ascending: false })
            .limit(20);

        if(tab === "snake") query = query.eq("game", "snake");
        if(tab === "guess") query = query.eq("game", "guess");

        const { data, error } = await query;

        if(error) throw error;

        lbLoading.classList.add("hidden");
        lbTable.classList.remove("hidden");

        if(!data || data.length === 0){
            lbTable.innerHTML = `<p style="color:#fff;text-align:center;padding:20px;">No scores yet — be the first! 🎮</p>`;
            return;
        }

        let html = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Game</th>
              <th>Score</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
        `;

        data.forEach((row, i) => {
            const medal  = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i+1);
            const gameIcon = row.game === "snake" ? "🐍" : "🧠";
            const timeStr  = row.time_secs != null ? row.time_secs + "s" : "—";
            const isMe     = row.username === currentUsername;

            html += `
            <tr class="${isMe ? 'my-row' : ''}">
              <td>${medal}</td>
              <td>${escapeHtml(row.username)}${isMe ? ' 👈' : ''}</td>
              <td>${gameIcon} ${row.game}</td>
              <td><strong>${row.score}</strong></td>
              <td>${timeStr}</td>
            </tr>
            `;
        });

        html += `</tbody></table>`;
        lbTable.innerHTML = html;

    } catch(err){
        lbLoading.innerText = "⚠️ Could not load leaderboard. Check your Supabase keys!";
        console.error(err);
    }
}

/* Save score to Supabase */
async function saveScore(game, score, time_secs = null){
    const msgEl = game === "snake"
        ? document.getElementById("savingMsg")
        : document.getElementById("savingMsgGuess");

    try {
        const { error } = await db.from("scores").insert([{
            username:  currentUsername,
            game:      game,
            score:     score,
            time_secs: time_secs
        }]);

        if(error) throw error;
        if(msgEl) msgEl.innerText = "✅ Score saved!";

    } catch(err){
        if(msgEl) msgEl.innerText = "⚠️ Couldn't save score.";
        console.error("Save error:", err);
    }
}

/* XSS safety */
function escapeHtml(str){
    return String(str)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;");
}

/* ============================================================ */
/* 🐍 SNAKE                                                     */
/* ============================================================ */
let canvas = document.getElementById("game");
let ctx    = canvas.getContext("2d");

let snake, food, particles;
let angle = 0, targetAngle = 0, speed = 1.5;
let gameRunning, score, time, timerInterval;
let highScore = localStorage.getItem("highScore") || 0;

let turningLeft  = false;
let turningRight = false;
let joystickActive = false;
let joystickX = 0, joystickCenterX = 0;

const joystickBase  = document.getElementById("joystickBase");
const joystickStick = document.getElementById("joystickStick");

function startSnake(){
    gameSelect.classList.add("hidden");
    snakePage.classList.remove("hidden");

    document.getElementById("joystickContainer").classList.toggle("hidden", !isMobile);

    snake = [];
    for(let i=0; i<25; i++) snake.push({x: 200 - i*6, y: 200});

    particles = [];
    food = {x:100, y:100, pulse:0};
    score = 0;
    time = 0;
    gameRunning = true;

    scoreEl.innerText = "Score: 0 | High: " + highScore;
    timeEl.innerText  = "Time: 0s";

    clearInterval(timerInterval);
    timerInterval = setInterval(()=>{
        time++;
        timeEl.innerText = "Time: " + time + "s";
    }, 1000);

    loop();
}

function loop(){
    if(!gameRunning) return;
    requestAnimationFrame(loop);
    update();
    draw();
}

function update(){
    if(turningLeft)  targetAngle -= 0.12;
    if(turningRight) targetAngle += 0.12;
    if(joystickActive) targetAngle += joystickX * 0.002;

    let diff = targetAngle - angle;
    if(diff > Math.PI)  diff -= Math.PI*2;
    if(diff < -Math.PI) diff += Math.PI*2;
    angle += diff * 0.25;

    let head = {
        x: snake[0].x + Math.cos(angle) * speed,
        y: snake[0].y + Math.sin(angle) * speed
    };

    if(head.x < 0 || head.y < 0 || head.x > 400 || head.y > 400){
        endGame();
        return;
    }

    snake.unshift(head);

    let dx = head.x - food.x;
    let dy = head.y - food.y;

    if(Math.sqrt(dx*dx + dy*dy) < 10){
        for(let i=0; i<12; i++){
            particles.push({
                x: food.x, y: food.y,
                vx: (Math.random()-0.5)*4,
                vy: (Math.random()-0.5)*4,
                life: 20
            });
        }

        food = {x: Math.random()*360+20, y: Math.random()*360+20, pulse:0};
        score++;

        if(score > highScore){
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        scoreEl.innerText = "Score: " + score + " | High: " + highScore;
    } else {
        snake.pop();
    }

    particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life--; });
    particles = particles.filter(p=>p.life>0);

    for(let i=1; i<snake.length; i++){
        let prev = snake[i-1], curr = snake[i];
        let dx = prev.x - curr.x;
        let dy = prev.y - curr.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > 6){ curr.x += dx*0.2; curr.y += dy*0.2; }
    }
}

function draw(){
    ctx.fillStyle = "#a8d45a";
    ctx.fillRect(0,0,400,400);

    ctx.beginPath();
    ctx.arc(food.x, food.y, 6, 0, Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();

    ctx.lineWidth = 10;
    ctx.lineCap   = "round";
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);
    for(let i=1; i<snake.length; i++) ctx.lineTo(snake[i].x, snake[i].y);
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
    particles.forEach(p=>{ ctx.fillRect(p.x,p.y,3,3); });
}

/* PC CONTROLS */
document.addEventListener("keydown", e=>{
    if(e.key=="a"||e.key=="ArrowLeft")  turningLeft  = true;
    if(e.key=="d"||e.key=="ArrowRight") turningRight = true;
});
document.addEventListener("keyup", e=>{
    if(e.key=="a"||e.key=="ArrowLeft")  turningLeft  = false;
    if(e.key=="d"||e.key=="ArrowRight") turningRight = false;
});

/* JOYSTICK */
if(joystickBase){
    joystickBase.addEventListener("touchstart", e=>{
        joystickActive = true;
        let rect = joystickBase.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width/2;
    });
    joystickBase.addEventListener("touchmove", e=>{
        if(!joystickActive) return;
        let dx = e.touches[0].clientX - joystickCenterX;
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

function toggleFullscreen(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

async function endGame(){
    gameRunning = false;
    clearInterval(timerInterval);

    finalScore.innerText = "Score: " + score;
    finalTime.innerText  = "Time: "  + time + "s";

    document.getElementById("savingMsg").innerText = "Saving score...";
    gameOver.classList.remove("hidden");

    // Save to Supabase
    await saveScore("snake", score, time);
}

function restartGame(){
    gameOver.classList.add("hidden");
    startSnake();
}

/* ============================================================ */
/* 🧠 GUESS                                                     */
/* ============================================================ */
let number, attempts;

function startGuess(){
    gameSelect.classList.add("hidden");
    guessPage.classList.remove("hidden");

    number = Math.floor(Math.random()*21);
    attempts = 0;

    attemptsEl.innerText = "Attempts: 0";
    result.innerText     = "";
}

async function checkGuess(){
    let val = parseInt(guessInput.value);

    if(isNaN(val) || val < 0 || val > 20){
        result.innerText = "Enter 0–20!";
        return;
    }

    attempts++;
    attemptsEl.innerText = "Attempts: " + attempts;

    if(val === number){
        result.innerText = "🎉 Correct!";

        // Show win overlay
        document.getElementById("winAttempts").innerText = "You got it in " + attempts + " attempt(s)!";
        document.getElementById("savingMsgGuess").innerText = "Saving score...";
        document.getElementById("guessWin").classList.remove("hidden");

        // Score = 21 - attempts (fewer attempts = higher score)
        const guessScore = Math.max(1, 21 - attempts);
        await saveScore("guess", guessScore);

    } else if(val > number){
        result.innerText = "Too high! ⬇️";
    } else {
        result.innerText = "Too low! ⬆️";
    }
}

function restartGuess(){
    document.getElementById("guessWin").classList.add("hidden");
    startGuess();
}
