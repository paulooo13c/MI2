window.onload = function() { 
    var canvas = document.getElementById("canvas");
    var ctx;
    var gravity = .3;
    
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
      function(/* function */ callback, /* DOMElement */ element){
        window.setTimeout(callback, 1000 / 60);
      };
    })();
    
    var audio = {
        isLoaded: false,
        mute: false,
        playAudio() {
            if($("mute").val) { //Speel geluid als de checkbox aangevinkt is
                document.getElementById("bell").currentTime = 0;
                document.getElementById("bell").play();
            }
            
        }
    }
    
    var game = {
        isPaused: false,
        isRunning: false,
        isOver: false,
        currentPipe: 0,
        start () { // init pipes
            for(var i = 0; i < difficulty.startPipeCount; i++) {
                pipes.addPipe();
            }
        },
        over() {
            background.color = "#FF0000";
            this.isOver = true;
        },
        loseDetect() {
            for(var i = 0; i < pipes.height.length; i++) {
                var currentPipeAngle = Math.PI * 2 / pipes.height.length + Math.PI * 2 / pipes.height.length * i;
                if(bird.angle % (Math.PI * 2) - currentPipeAngle < 0) { 
                    if(bird.angle % (Math.PI * 2) - currentPipeAngle > -.1) {//kijken of de hoek waarop de bird wordt geroteerd overeenkomt met de hoek waarop de huidige pipe geroteerd wordt
                        if(-bird.y - bird.height / 2 < pipes.height[i][1] || -bird.y + bird.height / 2 > pipes.height[i][1] + pipes.gap[i]) { // als de bird niet door de opening vliegt
                            game.over()
                        } else {
                            if(!game.isOver) {
                                score.updateScore() // increment score
                            }                            
                        }                           
                    } 
                } 
            }
            if(-bird.y < background.innerCircleRadius || -bird.y > background.radius) {
                game.over();
                bird.velocityy = 5; // bird valt naar beneden
            }
              
        },
        restart() { //restart init
            game.isOver = false;
            game.isRunning = false;
            background.color = "#00B4FF";
            bird.y = -125;
            bird.angle = 0;
            bird.velocityy = 0;
            gravity = .35;
            score.count = 0;
            pipes.speed = .35;
            difficulty.startPipeCount = 1;
            pipes.height = [];
            pipes.growing = [];
            pipes.gap = [];
        }
    }
    
    var background = {
        color: "#00B4FF",
        radius: 250, 
        innerCircleRadius: 25,
        drawBackground() {
            ctx.fillStyle = background.color;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#FFF";
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, background.radius, 0, 2 * Math.PI);
            ctx.closePath()
            ctx.fill();
            
            ctx.fillStyle = background.color;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, background.innerCircleRadius, 0, 2 * Math.PI);
            ctx.closePath()
            ctx.fill();
        },
        drawText() {
            if(!game.isOver && !game.isRunning) {
                ctx.fillStyle = "#FFF";
                ctx.fillText("PLAY NOW", canvas.width / 2, 50)
                ctx.font="14px Arial";
                ctx.fillText("Space to fly - esc to pause", canvas.width / 2, 75)
                ctx.fillStyle = background.color
            } else if(game.isOver) {
                ctx.fillStyle = "#FFF";
                ctx.fillText("GAME OVER", canvas.width / 2, 50)
                ctx.font="14px Arial";
                ctx.fillText("Enter to restart", canvas.width / 2, 75)
                ctx.fillStyle = background.color
            }
        },
    }
    
    var bird = {
        width: 20,
        height: 15,
        angle: 0,
        x: 0,
        y: -125,
        velocityy: 0,
        
        drawBird() {
            if(game.isRunning && !game.isOver) {
                bird.angle += difficulty.speed; // rotate bird
            } else { // startscherm, de bird springt zelf
                if(bird.y > -100 && !game.isOver) {
                    if(bird.velocityy > -4) {
                        bird.velocityy -= 5;
                        spaceBar.isPressed = true;
                    }                    
                } else {
                    spaceBar.isPressed = false;
                }
                
            } 
            if (bird.y <= 0) {
                bird.velocityy += gravity;                
            } else {
                bird.velocityy = 0;
                bird.y = 0;
            }
            bird.y += bird.velocityy;
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2); //transform canvas om bird te tekenen
            ctx.rotate(this.angle);            
            
            ctx.fillstyle = background.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height); //teken bird
            
            
            ctx.restore();
        },
        flyUp() {
            spaceBar.isPressed = true
            if(!game.isOver) {
                bird.velocityy -= 7.5;
                if(bird.velocityy < -7.5) {
                    bird.velocityy = -7.5
                }
                game.isRunning = true;
            }
        }
    }
    
    var pipes = {
        width: 10,
        areMovingUpAndDown: false,
        growing: [], // of de pipe groeit of krimpt
        gap: [], // grootte van de gap 
        height: [], //Er worden per pipe 2 hoogtes bijgehouden: de hoogte die ze moet worden en 0, de 0 gaat omhoog tot ze even groot is als de eerste waarde
        speed: .35, //snelheid waarmee ze groeien/krimpen        
        
        addPipe() {
            if(Math.random > .5) {
                this.growing.push(true);
            } else {
                this.growing.push(false);
            }
            this.height.push([getRandomInt(50, 175), 0]);
            this.gap.push(background.radius);
        },
        
        drawPipes() { 
            for(var i = 0; i < this.height.length; i++) {
                if(pipes.areMovingUpAndDown) {
                    if(this.growing[i]) { //hoogte aanpassen voor groeien / krimpen
                        if(this.height[i][0] < 125) {
                            this.height[i][0] += this.speed;
                        } else {
                            this.growing[i] = false;
                        }                    
                    } else {
                        if(this.height[i][0] > 50) {
                            this.height[i][0] -= this.speed;
                        } else {
                            this.growing[i] = true;
                        }    
                    }
                }
                
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2); //transform om de huidige pipe te tekenen
                ctx.rotate(Math.PI * 2 / this.height.length + Math.PI * 2 / this.height.length * i);
                ctx.fillStyle = background.color;
                if(this.gap[i] > 75) { //gap grootte verkleinen tot standaard waarde
                    this.gap[i] -= 2;
                }
                if(this.height[i][0] > this.height[i][1]) {
                    this.height[i][1] += 2; //2de waarde van de height vergroten tot ze evengroot is als de eerste waarde
                    ctx.fillRect(-this.width / 2, 0, this.width, -this.height[i][1])
                    ctx.fillRect(-this.width / 2, -this.height[i][1] - this.gap[i], this.width, -background.radius)
                    
                    
                } else {
                    pipes.areMovingUpAndDown = true;
                    this.height[i][1] = this.height[i][0];
                    ctx.fillRect(-this.width / 2, 0, this.width, -this.height[i][0])
                    ctx.fillRect(-this.width / 2, -this.height[i][0] - this.gap[i], this.width, -background.radius)
                }
                ctx.restore();
            }
        }
    }
    
    var score = {
        count: 0,
        prevScoreAngle: 0,
        updateScore() {
            
            if(bird.angle - score.prevScoreAngle > .1) { // slechts 1 punt geven per keer dat bird een pipe door vliegt
                this.count++;
                audio.playAudio();
                if(this.count % 10 == 0 || this.count == 1 || this.count == 3) { //levels
                    difficulty.increase();
                }
            }
            score.prevScoreAngle = bird.angle;
        },
        drawScore() {
            ctx.fillStyle= "#FFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "30px Arial"
            ctx.fillText(this.count, canvas.width / 2, canvas.height / 2);
        }
    }
    
    var difficulty = {
        startPipeCount: 1,
        speed: .0175,
        increase() {
            pipes.speed += .1; //pipes gaan sneller         
            pipes.height = [];
            pipes.gap = [];
            this.startPipeCount++
            for(var i = 0; i < this.startPipeCount; i++) {
                pipes.addPipe();
            }
            background.color = "rgb(" + getRandomInt(0, 255) + ", " + getRandomInt(0, 255) + ", " + getRandomInt(0, 255) + ")"; //random bg color per level
        }
    }
    
    var spaceBar = {
        width: background.radius * 2,
        height: 50, 
        isPressed: false,
        drawSpaceBar() {
            
            if(!this.isPressed) {
                ctx.fillStyle = "#DDD"
                ctx.beginPath();
                ctx.moveTo(canvas.width / 2 - background.radius - 3, canvas.height / 2 + background.radius + 25 - 3); //linksboven
                ctx.lineTo(canvas.width / 2 + background.radius - 3, canvas.height / 2 + background.radius + 25 - 3);//rechtsboven
                ctx.lineTo(canvas.width / 2 + background.radius, canvas.height / 2 + background.radius + 25); //rechtsOnder
                ctx.lineTo(canvas.width / 2 - background.radius, canvas.height / 2 + background.radius + 25); //rechtsOnder
                ctx.lineTo(canvas.width / 2 - background.radius, canvas.height / 2 + background.radius + 25 + this.height); //linksOnderechts
                ctx.lineTo(canvas.width / 2 - background.radius - 3, canvas.height / 2 + background.radius + 25 + this.height - 5); //linksOnderlinks
                ctx.lineTo(canvas.width / 2 - background.radius - 3, canvas.height / 2 + background.radius + 25 - 3); //linksOnderechts
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = "#FFF"
                ctx.fillRect(canvas.width / 2 - background.radius, canvas.height / 2 + background.radius + 25, this.width, this.height)
                
                ctx.fillStyle = background.color;
                ctx.fillText("Space Bar", canvas.width / 2, canvas.height / 2 + background.radius + 50)
            } else {
                ctx.fillStyle = "#FFF"
                ctx.fillRect(canvas.width / 2 - background.radius - 3, canvas.height / 2 + background.radius + 25 - 3, this.width, this.height)
                
                ctx.fillStyle = background.color;
                ctx.fillText("Space Bar", canvas.width / 2 - 3, canvas.height / 2 + background.radius + 50 - 3)
            }            
            
            
            
            
        },
    }
    function isCanvasSupported() {        
        if(document.body.contains(document.getElementById("canvas"))) { console.log("Canvas element bestaat");}
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    }        
    if (!isCanvasSupported()){ alert("Your browser does not support HTML5 canvas");} else startCanvas();
    // getRandomInt van http://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } 
    function resizeCanvas() {
        canvas.width = $("#container").width() * .99;
        canvas.height = $("#container").height() * .99;
    }
    window.addEventListener('resize', function(event){
        resizeCanvas()
    });
    function startCanvas() {  
        resizeCanvas();
        ctx = canvas.getContext("2d");
        animationLoop();
    }
    function animationLoop() {
        if(!game.isPaused) {
            drawScreen()
        }    
        requestAnimFrame(animationLoop);
    }
    function drawScreen() { 
        ctx.clearRect(0, 0, canvas.width, canvas.height)        
            
        background.drawBackground();
        bird.drawBird();
        pipes.drawPipes();
        game.loseDetect();
        score.drawScore();
        spaceBar.drawSpaceBar();
        background.drawText();
    }
    
    $(window).keypress(function(e) {
        if (e.which === 32) { // Space
            if(!game.isRunning) {
                game.start();
            }
            bird.flyUp();
        }
        if (e.which === 13) { // Enter
            game.restart();
                
        }
    });
    $(window).keyup(function(e) {
        if (e.which === 32) { // Space
            spaceBar.isPressed = false;
        }
        if (e.which === 27) { // esc
            if(game.isRunning) {
                game.isPaused = !game.isPaused;
            }            
        }
    });
    $(window).click(function(e) {
        if(e.clientX > canvas.width / 2 - background.radius && e.clientX < canvas.width / 2 + background.radius) {
            if(e.clientY > canvas.height / 2 + background.radius + 25 && e.clientY < canvas.height / 2 + background.radius + 25 + spaceBar.height) {
                bird.flyUp();
            }
        }
    });
}