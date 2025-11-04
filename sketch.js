
let questions = [];
let selectedQuestions = [];
let currentQuestion = 0;
let score = 0;
let gameState = 'loading'; // loading, playing, finished
let table;
let buttons = [];
let feedback = '';

// 在全域變數區域加入煙火相關變數
let fireworks = [];
let gravity;

function preload() {
  table = loadTable('questions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight); // 改為填滿整個視窗
  textAlign(CENTER, CENTER);
  gravity = createVector(0, 0.2);
  
  // 從CSV載入所有題目
  for (let r = 0; r < table.getRowCount(); r++) {
    let row = table.getRow(r);
    questions.push({
      question: row.getString('題目'),
      options: [
        row.getString('選項A'),
        row.getString('選項B'),
        row.getString('選項C'),
        row.getString('選項D')
      ],
      correct: row.getString('正確答案')
    });
  }
  
  // 隨機選擇5題
  let shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = floor(random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  selectedQuestions = shuffled.slice(0, 5);
  
  // 建立按鈕（起始位置會在 draw 根據題目高度重新建立）
  createButtons(height * 0.48);
  
  gameState = 'playing';
}

// 新增：視窗大小改變時保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createButtons(height * 0.48);
}

function createButtons(startY = 380) {
  const buttonWidth = 700;
  const buttonHeight = 64;     // 微調按鈕高度
  const startX = width / 2 - buttonWidth / 2;
  const gap = 70;              // 縮短按鈕之間間距（從 100 -> 70）

  buttons = [];
  let options = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < 4; i++) {
    let y = startY + i * gap;
    buttons.push({
      x: startX,
      y: y,
      width: buttonWidth,
      height: buttonHeight,
      label: options[i]
    });
  }
}

function draw() {
  background(50);
  
  if (gameState === 'playing') {
    // 顯示目前題目
    fill(255);
    textSize(36); // 放大文字
    text(`題目 ${currentQuestion + 1}/5`, width/2, 100);
    
    textSize(42); // 放大題目文字
    text(selectedQuestions[currentQuestion].question, width/2, 250);
    
    // 根據題目底部動態決定按鈕起始 Y，避免重疊
    let qY = 250;
    let qH = 42;
    let buttonsStartY = qY + qH + 12; // 縮短題目與選項間距

    createButtons(buttonsStartY);

    // 繪製按鈕（按鈕半透明，並加入高亮）
    for (let i = 0; i < buttons.length; i++) {
      let b = buttons[i];
      push();
      let hover = mouseIsOverButton(b);
      fill(hover ? color(255, 220) : color(255, 180), 220);
      stroke(255, 200);
      strokeWeight(2);
      rect(b.x, b.y, b.width, b.height, 18);
      noStroke();
      textSize(28);
      textAlign(CENTER, CENTER);
      let optionText = selectedQuestions.length > 0 ? selectedQuestions[currentQuestion].options[i] : '';
      let maxTextWidth = b.width - 40;
      textSize(28);
      if (textWidth(optionText) > maxTextWidth) {
        let scale = maxTextWidth / textWidth(optionText);
        textSize(28 * scale);
      }
      fill(0, 160);
      text(optionText, b.x + b.width/2 + 2, b.y + b.height/2 + 2);
      fill(10);
      text(optionText, b.x + b.width/2, b.y + b.height/2);
      pop();
    }

    // 回饋文字放在按鈕上方（相對位置也縮短）
    if (feedback) {
      textSize(32);
      fill(255);
      textAlign(CENTER, CENTER);
      let feedbackY = buttonsStartY - 20;
      text(feedback, width / 2, feedbackY);
    }
  } else if (gameState === 'finished') {
    // 顯示結果
    fill(255);
    textSize(64); // 放大結果文字
    text(`測驗完成！`, width/2, height/3 - 50);
    text(`你的得分是: ${score}/5`, width/2, height/3 + 50);
    
    textSize(48);
    let feedbackText = '';
    if (score === 5) feedbackText = "太棒了！滿分！";
    else if (score >= 3) feedbackText = "做得不錯！";
    else feedbackText = "再加油！";
    
    text(feedbackText, width/2, height/2 + 50);
  }
  
  // 更新並顯示煙火
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].show();
    if (fireworks[i].done()) {
      fireworks.splice(i, 1);
    }
  }
}

function mousePressed() {
  if (gameState === 'playing') {
    for(let i = 0; i < buttons.length; i++) {
      if (mouseIsOverButton(buttons[i])) {
        checkAnswer(i);
        break;
      }
    }
  }
}

function mouseIsOverButton(b) {
  return mouseX > b.x && mouseX < b.x + b.width && 
         mouseY > b.y && mouseY < b.y + b.height;
}

function checkAnswer(answerIndex) {
  let correct = selectedQuestions[currentQuestion].correct === ['A','B','C','D'][answerIndex];

  if (correct) {
    score++;
    feedback = '答對了！';
    for (let i = 0; i < 8; i++) {
      fireworks.push(new Firework());
    }
  } else {
    feedback = '答錯了...';
  }

  setTimeout(() => {
    feedback = '';
    currentQuestion++;
    if (currentQuestion >= 5) {
      gameState = 'finished';
      // 若得分 >= 4，觸發整個螢幕的大爆炸特效
      if (score >= 4) {
        triggerFullScreenExplosion();
      } else if (score === 5) {
        // 若滿分也補一波
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            fireworks.push(new Firework());
          }, i * 200);
        }
      }
    }
  }, 1000);
}

// 新增：立即在整個畫面產生大量爆炸粒子，達到「炸翻全螢幕」效果
function triggerFullScreenExplosion() {
  // 在整個寬度上產生多個爆炸源，並直接呼叫 explode() 建立大量粒子
  const step = max(24, floor(width / 40));
  for (let x = 0; x < width; x += step) {
    const fw = new Firework(x + random(-20, 20));
    // 將火花放在畫面中上方位置，並直接觸發爆炸
    fw.pos = createVector(x + random(-20, 20), random(height * 0.2, height * 0.6));
    fw.exploded = true;
    fw.explode();
    fireworks.push(fw);
  }

  // 再補幾波延遲爆炸增強視覺
  for (let wave = 1; wave <= 5; wave++) {
    setTimeout(() => {
      for (let i = 0; i < 12; i++) {
        const px = random(width);
        const fw = new Firework(px);
        fw.pos = createVector(px, random(height * 0.15, height * 0.7));
        fw.exploded = true;
        fw.explode();
        fireworks.push(fw);
      }
    }, wave * 300);
  }
}

// 煙火類別
class Firework {
  constructor() {
    this.pos = createVector(random(width), height);
    this.vel = createVector(0, random(-16, -12)); // 增加上升速度
    this.acc = createVector(0, 0);
    this.color = color(random(255), random(255), random(255));
    this.particles = [];
    this.exploded = false;
    this.size = random(2, 4); // 煙火大小
  }

  done() {
    return this.exploded && this.particles.length === 0;
  }

  update() {
    if (!this.exploded) {
      this.vel.add(gravity);
      this.pos.add(this.vel);
      
      if (this.vel.y >= 0) {
        this.exploded = true;
        this.explode();
      }
    }
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].done()) {
        this.particles.splice(i, 1);
      }
    }
  }

  explode() {
    // 增加粒子數量
    for (let i = 0; i < 150; i++) {
      const p = new Particle(
        this.pos.x, 
        this.pos.y, 
        this.color,
        random(1, 3) // 隨機粒子大小
      );
      this.particles.push(p);
    }
    // 產生第二層爆炸
    if (random() > 0.5) {
      for (let i = 0; i < 50; i++) {
        const p = new Particle(
          this.pos.x, 
          this.pos.y, 
          color(random(255), random(255), random(255)),
          random(2, 4)
        );
        p.vel.mult(1.5); // 第二層速度更快
        this.particles.push(p);
      }
    }
  }

  show() {
    if (!this.exploded) {
      stroke(this.color);
      strokeWeight(this.size);
      point(this.pos.x, this.pos.y);
    }
    
    for (let particle of this.particles) {
      particle.show();
    }
  }
}

// 煙火粒子類別
class Particle {
  constructor(x, y, color, size = 2) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(3, 12)); // 增加粒子速度
    this.acc = createVector(0, 0);
    this.color = color;
    this.size = size;
    this.lifespan = 255;
    this.decay = random(2, 6); // 隨機衰減速度
  }

  done() {
    return this.lifespan < 0;
  }

  update() {
    this.vel.add(gravity);
    this.pos.add(this.vel);
    this.lifespan -= this.decay;
    
    // 加入尾跡效果
    if (random() < 0.3) {
      this.vel.mult(0.98);
    }
  }

  show() {
    if (!this.done()) {
      stroke(
        red(this.color),
        green(this.color),
        blue(this.color),
        this.lifespan
      );
      strokeWeight(this.size);
      point(this.pos.x, this.pos.y);
      
      // 加入光暈效果
      strokeWeight(this.size * 0.5);
      stroke(
        red(this.color),
        green(this.color),
        blue(this.color),
        this.lifespan * 0.5
      );
      point(this.pos.x, this.pos.y);
    }
  }
}
