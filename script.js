/* 💎 COINS */
let coins = parseInt(localStorage.getItem("coins") || 0);

function updateCoins(){
    document.getElementById("coins").innerText = "Coins: " + coins;
}
updateCoins();

/* 📂 NAVIGATION */
function show(id){
    document.querySelectorAll(".page").forEach(p=>p.style.display="none");
    document.getElementById(id).style.display="block";
}

/* 🎮 GAME */
let canvas = document.getElementById("game");
let ctx = canvas.getContext("2d");

let x = 140, y = 140;

document.addEventListener("keydown", e=>{
    if(e.key=="ArrowUp") y-=10;
    if(e.key=="ArrowDown") y+=10;
    if(e.key=="ArrowLeft") x-=10;
    if(e.key=="ArrowRight") x+=10;

    draw();
});

function startGame(){
    x=140; y=140;
    draw();
}

function draw(){
    ctx.clearRect(0,0,300,300);

    ctx.fillStyle="cyan";
    ctx.fillRect(x,y,20,20);

    coins++;
    localStorage.setItem("coins", coins);
    updateCoins();
}

/* 🧑 AVATAR */
function setAvatar(src){
    localStorage.setItem("avatar", src);
    document.getElementById("avatar").src = src;
}

let savedAvatar = localStorage.getItem("avatar");
if(savedAvatar){
    document.getElementById("avatar").src = savedAvatar;
}

/* 🛒 SHOP */
function buy(price){
    if(coins >= price){
        coins -= price;
        localStorage.setItem("coins", coins);
        updateCoins();
        alert("Bought!");
    } else {
        alert("Not enough coins!");
    }
}

/* 🏆 LEADERBOARD */
let scores = JSON.parse(localStorage.getItem("scores") || "[]");

function addScore(s){
    scores.push(s);
    scores.sort((a,b)=>b-a);
    localStorage.setItem("scores", JSON.stringify(scores));
}

function loadBoard(){
    let ul = document.getElementById("board");
    ul.innerHTML="";
    scores.forEach(s=>{
        ul.innerHTML += "<li>"+s+"</li>";
    });
}
loadBoard();

/* 🎧 MUSIC */
function changeMusic(src){
    let music = document.getElementById("music");

    if(src===""){
        music.pause();
        return;
    }

    music.src = src;
    music.play();
}
