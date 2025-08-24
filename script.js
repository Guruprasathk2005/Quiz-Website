let questions = [], currentQ = 0, score = 0, timer, timeLeft;
let userAnswers = [];
let quizUser = {};

const sheetURL = "https://script.google.com/macros/s/AKfycbyIzzYjQYMQ7kVrMxOXmn6w3MSS-ihKPA0jNwtbkzVpCDhoj-_GvZmGBhQRo430IfaS/exec"; // Replace with your Apps Script Web App URL

document.getElementById("startBtn").onclick = validateJoinCode;

function validateJoinCode() {
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const code = document.getElementById("joinCode").value.trim();

  if(!name || !email || !code){
    document.getElementById("joinError").innerText = "Please enter all details";
    return;
  }

  fetch(`${sheetURL}?action=validateCode&code=${code}`)
    .then(res => res.json())
    .then(data => {
      if(data.valid) startQuiz(name,email,code,data.quizTimer);
      else document.getElementById("joinError").innerText = "Invalid Join Code";
    });
}

function startQuiz(name,email,code,quizTimer) {
  quizUser = { name,email,code,quizTimer };
  fetch(`${sheetURL}?action=getQuestions`)
    .then(res => res.json())
    .then(data => {
      questions = data.questions;
      timeLeft = quizTimer;
      userAnswers = Array(questions.length).fill(null);
      currentQ = 0;
      document.getElementById("join-section").style.display="none";
      document.getElementById("quiz-section").style.display="block";
      showQuestion();
      startTimer();
    });
}

function showQuestion() {
  const q = questions[currentQ];
  document.getElementById("progress").innerText = `Question ${currentQ+1} / ${questions.length}`;
  document.getElementById("question").innerText = q.question;
  const answersDiv = document.getElementById("answers");
  answersDiv.innerHTML = "";
  q.options.forEach((opt,i)=>{
    const btn=document.createElement("button");
    btn.innerText=opt;
    btn.className="answer-btn";
    if(userAnswers[currentQ]===i) btn.classList.add("selected");
    btn.onclick=()=>{ userAnswers[currentQ]=i; showQuestion(); };
    answersDiv.appendChild(btn);
  });
}

function prevQuestion(){ if(currentQ>0){ currentQ--; showQuestion(); } }
function nextQuestion(){ if(currentQ<questions.length-1){ currentQ++; showQuestion(); } }

function startTimer(){
  updateTimer();
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{
    if(timeLeft<=0){ 
      clearInterval(timer);
      finishQuiz(true);  // auto-finish if time runs out
      return; 
    }
    timeLeft--; updateTimer();
  },1000);
}
function updateTimer(){
  const m=Math.floor(timeLeft/60), s=timeLeft%60;
  document.getElementById("timer").innerText = m>0 ? `${m}:${s.toString().padStart(2,"0")} min` : `${s} sec`;
}

function submitQuiz(){
  // 🚫 Don't stop timer here (timer keeps running in review)
  document.getElementById("quiz-section").style.display="none";
  document.getElementById("review-section").style.display="block";

  const reviewDiv=document.getElementById("review-buttons");
  reviewDiv.innerHTML="";
  questions.forEach((q,i)=>{
    const btn=document.createElement("button");
    btn.innerText=i+1;
    btn.className="review-btn "+(userAnswers[i]!==null?"green":"red");
    btn.onclick=()=>{ 
      currentQ=i; 
      document.getElementById("review-section").style.display="none"; 
      document.getElementById("quiz-section").style.display="block"; 
      showQuestion(); 
    };
    reviewDiv.appendChild(btn);
  });

  document.getElementById("finishBtn").onclick=()=>finishQuiz(false);
}

function finishQuiz(auto=false){
  clearInterval(timer); // ✅ Stop timer only at finish
  if(!auto){
    if(!confirm("Are you sure to finish?")) {
      startTimer(); // resume timer if cancelled
      return;
    }
  }

  // calculate score
  score=0;
  questions.forEach((q,i)=>{ if(userAnswers[i]!==null && q.options[userAnswers[i]]===q.correct) score++; });

  // format time taken
  const totalSeconds = quizUser.quizTimer - timeLeft;
  let timeTakenFormatted = "";
  if(totalSeconds < 60) timeTakenFormatted = `${totalSeconds} sec`;
  else {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    timeTakenFormatted = `${m}:${s.toString().padStart(2,"0")} min`;
  }

  // send to sheet
  const payload={ 
    name:quizUser.name,
    email:quizUser.email,
    joinCode:quizUser.code,
    score,
    timeTaken: timeTakenFormatted
  };
  fetch(sheetURL,{method:"POST",body:JSON.stringify(payload)})
    .then(res=>res.json()).then(d=>{ window.location.href="thankyou.html"; });
}




















