(function () {
  "use strict";

  const Templates = {
    initialized: false,

    state: {
      category: "all",
      search: ""
    },

    templates: [
      {
        id: "landing-page",
        name: "Landing Page",
        description:
          "Clean responsive landing page for products and services.",
        category: "websites",
        type: "website",
        tags: ["HTML", "CSS", "Responsive"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
</head>
<body>

  <main class="hero">
    <nav class="nav">
      <strong>KAISOUL</strong>
      <a href="#start">Get Started</a>
    </nav>

    <section class="hero-content">
      <span class="badge">Build something great</span>

      <h1>
        Turn your ideas into reality.
      </h1>

      <p>
        A clean starting point for your next website.
      </p>

      <a class="button" href="#start">
        Get Started
      </a>
    </section>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  background: #0b0b0c;
  color: #ffffff;
}

.hero {
  min-height: 100vh;
  padding: 24px;
}

.nav {
  max-width: 1100px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav a {
  color: #ffffff;
  text-decoration: none;
}

.hero-content {
  max-width: 760px;
  margin: 18vh auto 0;
  text-align: center;
}

.badge {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid #2a2a2d;
  border-radius: 999px;
  color: #a0a0a8;
}

h1 {
  font-size: clamp(42px, 8vw, 84px);
  line-height: 0.98;
  margin: 24px 0;
}

p {
  color: #9b9ba3;
  font-size: 18px;
}

.button {
  display: inline-block;
  margin-top: 24px;
  padding: 13px 20px;
  background: #ffffff;
  color: #111111;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
}
        `.trim(),

        js: ""
      },

      {
        id: "portfolio",
        name: "Portfolio",
        description:
          "Developer portfolio with projects and contact section.",
        category: "websites",
        type: "website",
        tags: ["Portfolio", "Developer", "CSS"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Developer Portfolio</title>
</head>
<body>

  <header class="header">
    <strong>YOUR NAME</strong>
    <nav>
      <a href="#projects">Projects</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main>
    <section class="intro">
      <p class="eyebrow">Developer</p>
      <h1>Building digital experiences.</h1>
      <p>
        I create websites, applications and interactive experiences.
      </p>
    </section>

    <section id="projects">
      <h2>Projects</h2>

      <div class="projects">
        <article>
          <h3>Project One</h3>
          <p>Describe your project here.</p>
        </article>

        <article>
          <h3>Project Two</h3>
          <p>Describe your project here.</p>
        </article>

        <article>
          <h3>Project Three</h3>
          <p>Describe your project here.</p>
        </article>
      </div>
    </section>

    <section id="contact">
      <h2>Contact</h2>
      <p>your@email.com</p>
    </section>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #0b0b0c;
  color: #f5f5f5;
  font-family: Inter, system-ui, sans-serif;
}

.header {
  max-width: 1100px;
  margin: auto;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header nav {
  display: flex;
  gap: 18px;
}

.header a {
  color: #999;
  text-decoration: none;
}

main {
  max-width: 1100px;
  margin: auto;
  padding: 60px 24px;
}

.intro {
  max-width: 750px;
  padding: 80px 0;
}

.eyebrow {
  color: #888;
}

h1 {
  font-size: clamp(42px, 8vw, 80px);
  line-height: 1;
}

h2 {
  margin-top: 80px;
}

.projects {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.projects article {
  border: 1px solid #29292d;
  padding: 24px;
  border-radius: 12px;
}

.projects p {
  color: #999;
}

@media (max-width: 700px) {
  .header nav {
    display: none;
  }

  .projects {
    grid-template-columns: 1fr;
  }
}
        `.trim(),

        js: ""
      },

      {
        id: "login-page",
        name: "Login Page",
        description:
          "Responsive login interface with basic validation.",
        category: "websites",
        type: "website",
        tags: ["Login", "Form", "JavaScript"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login</title>
</head>
<body>

  <main class="login-page">
    <form id="loginForm" class="login-card">

      <h1>Welcome back</h1>
      <p>Sign in to continue.</p>

      <label>
        Email
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          required
        >
      </label>

      <label>
        Password
        <input
          id="password"
          type="password"
          placeholder="Password"
          required
        >
      </label>

      <button type="submit">
        Sign in
      </button>

      <small id="message"></small>

    </form>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, system-ui, sans-serif;
  background: #0b0b0c;
  color: #fff;
}

.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}

.login-card {
  width: min(100%, 400px);
  padding: 28px;
  border: 1px solid #29292d;
  border-radius: 16px;
  background: #111113;
}

.login-card h1 {
  margin-bottom: 8px;
}

.login-card p {
  color: #999;
}

label {
  display: block;
  margin-top: 18px;
  color: #aaa;
}

input {
  width: 100%;
  margin-top: 8px;
  padding: 13px;
  border: 1px solid #303035;
  border-radius: 9px;
  background: #0b0b0c;
  color: #fff;
}

button {
  width: 100%;
  margin-top: 22px;
  padding: 13px;
  border: 0;
  border-radius: 9px;
  background: #fff;
  color: #111;
  font-weight: 700;
  cursor: pointer;
}

#message {
  display: block;
  margin-top: 14px;
}
        `.trim(),

        js: `
const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", event => {
  event.preventDefault();

  message.textContent =
    "Demo login submitted.";
});
        `.trim()
      },

      {
        id: "dashboard",
        name: "Dashboard",
        description:
          "Modern admin dashboard starter.",
        category: "apps",
        type: "app",
        tags: ["Dashboard", "UI", "App"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
</head>
<body>

  <aside>
    <strong>Dashboard</strong>
    <a href="#">Overview</a>
    <a href="#">Projects</a>
    <a href="#">Settings</a>
  </aside>

  <main>
    <header>
      <h1>Overview</h1>
      <button id="refresh">Refresh</button>
    </header>

    <section class="stats">
      <article>
        <span>Projects</span>
        <strong>24</strong>
      </article>

      <article>
        <span>Users</span>
        <strong>1,248</strong>
      </article>

      <article>
        <span>Revenue</span>
        <strong>$8,420</strong>
      </article>
    </section>

    <section class="panel">
      <h2>Recent Activity</h2>
      <ul id="activity">
        <li>New project created</li>
        <li>User joined the community</li>
        <li>Project published</li>
      </ul>
    </section>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #0b0b0c;
  color: #f5f5f5;
  font-family: Inter, system-ui, sans-serif;
  display: grid;
  grid-template-columns: 220px 1fr;
}

aside {
  border-right: 1px solid #29292d;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

aside a {
  color: #999;
  text-decoration: none;
}

main {
  padding: 32px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

button {
  padding: 10px 14px;
  border: 1px solid #333;
  border-radius: 8px;
  background: #fff;
  color: #111;
  cursor: pointer;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 30px;
}

.stats article,
.panel {
  border: 1px solid #29292d;
  border-radius: 12px;
  padding: 22px;
}

.stats span {
  display: block;
  color: #888;
}

.stats strong {
  display: block;
  font-size: 32px;
  margin-top: 10px;
}

.panel {
  margin-top: 16px;
}

li {
  margin: 12px 0;
  color: #aaa;
}

@media (max-width: 700px) {
  body {
    display: block;
  }

  aside {
    display: none;
  }

  main {
    padding: 20px;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
        `.trim(),

        js: `
document
  .getElementById("refresh")
  .addEventListener("click", () => {
    const activity =
      document.getElementById("activity");

    const item =
      document.createElement("li");

    item.textContent =
      "Dashboard refreshed";

    activity.prepend(item);
  });
        `.trim()
      },

      {
        id: "calculator",
        name: "Calculator",
        description:
          "Simple functional calculator built with JavaScript.",
        category: "apps",
        type: "app",
        tags: ["JavaScript", "Calculator"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Calculator</title>
</head>
<body>

  <main class="calculator">
    <input id="display" readonly>

    <div class="keys">
      <button data-key="7">7</button>
      <button data-key="8">8</button>
      <button data-key="9">9</button>
      <button data-key="/">÷</button>

      <button data-key="4">4</button>
      <button data-key="5">5</button>
      <button data-key="6">6</button>
      <button data-key="*">×</button>

      <button data-key="1">1</button>
      <button data-key="2">2</button>
      <button data-key="3">3</button>
      <button data-key="-">−</button>

      <button data-key="0">0</button>
      <button data-key=".">.</button>
      <button data-action="clear">C</button>
      <button data-key="+">+</button>

      <button class="equals" data-action="equals">=</button>
    </div>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b0b0c;
  color: white;
  font-family: Inter, system-ui, sans-serif;
}

.calculator {
  width: min(100% - 32px, 360px);
  padding: 18px;
  background: #141416;
  border: 1px solid #29292d;
  border-radius: 16px;
}

#display {
  width: 100%;
  height: 70px;
  margin-bottom: 12px;
  border: 1px solid #29292d;
  border-radius: 10px;
  background: #0b0b0c;
  color: white;
  text-align: right;
  padding: 12px;
  font-size: 28px;
}

.keys {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.keys button {
  min-height: 58px;
  border: 1px solid #29292d;
  border-radius: 9px;
  background: #1d1d20;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.keys .equals {
  grid-column: span 4;
  background: white;
  color: #111;
}
        `.trim(),

        js: `
const display =
  document.getElementById("display");

document
  .querySelectorAll("[data-key]")
  .forEach(button => {
    button.addEventListener("click", () => {
      display.value +=
        button.dataset.key;
    });
  });

document
  .querySelector('[data-action="clear"]')
  .addEventListener("click", () => {
    display.value = "";
  });

document
  .querySelector('[data-action="equals"]')
  .addEventListener("click", () => {
    try {
      display.value =
        Function(
          "return " +
          display.value
        )();
    } catch {
      display.value = "Error";
    }
  });
        `.trim()
      },

      {
        id: "todo-app",
        name: "Todo App",
        description:
          "Minimal todo application with local interaction.",
        category: "apps",
        type: "app",
        tags: ["Todo", "JavaScript", "Local"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo App</title>
</head>
<body>

  <main class="todo">
    <h1>Todo</h1>

    <form id="todoForm">
      <input
        id="todoInput"
        placeholder="Add a task..."
        autocomplete="off"
      >
      <button>Add</button>
    </form>

    <ul id="todoList"></ul>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b0b0c;
  color: white;
  font-family: Inter, system-ui, sans-serif;
}

.todo {
  width: min(100% - 32px, 520px);
}

form {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  padding: 13px;
  border: 1px solid #29292d;
  border-radius: 9px;
  background: #141416;
  color: white;
}

button {
  padding: 13px 18px;
  border: 0;
  border-radius: 9px;
  background: white;
  color: #111;
  font-weight: 700;
}

li {
  margin-top: 10px;
  padding: 14px;
  border: 1px solid #29292d;
  border-radius: 9px;
  list-style: none;
  cursor: pointer;
}

ul {
  padding: 0;
}

.completed {
  opacity: 0.5;
  text-decoration: line-through;
}
        `.trim(),

        js: `
const form =
  document.getElementById("todoForm");

const input =
  document.getElementById("todoInput");

const list =
  document.getElementById("todoList");

form.addEventListener("submit", event => {
  event.preventDefault();

  const value =
    input.value.trim();

  if (!value) return;

  const item =
    document.createElement("li");

  item.textContent = value;

  item.addEventListener(
    "click",
    () => {
      item.classList.toggle(
        "completed"
      );
    }
  );

  list.appendChild(item);

  input.value = "";
});
        `.trim()
      },

      {
        id: "snake-game",
        name: "Snake Game",
        description:
          "Classic Snake game using Canvas.",
        category: "games",
        type: "game",
        tags: ["Canvas", "Game", "JavaScript"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Snake</title>
</head>
<body>

  <main>
    <h1>Snake</h1>
    <p>Score: <strong id="score">0</strong></p>
    <canvas id="game" width="360" height="360"></canvas>
  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b0b0c;
  color: white;
  font-family: Inter, system-ui, sans-serif;
}

main {
  text-align: center;
}

canvas {
  width: min(90vw, 360px);
  height: auto;
  background: #111113;
  border: 1px solid #29292d;
}
        `.trim(),

        js: `
const canvas =
  document.getElementById("game");

const ctx =
  canvas.getContext("2d");

const scoreElement =
  document.getElementById("score");

const size = 18;

let snake = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 }
];

let direction = {
  x: 1,
  y: 0
};

let food = {
  x: 15,
  y: 15
};

let score = 0;

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "ArrowUp" &&
      direction.y !== 1
    ) {
      direction = { x: 0, y: -1 };
    }

    if (
      event.key === "ArrowDown" &&
      direction.y !== -1
    ) {
      direction = { x: 0, y: 1 };
    }

    if (
      event.key === "ArrowLeft" &&
      direction.x !== 1
    ) {
      direction = { x: -1, y: 0 };
    }

    if (
      event.key === "ArrowRight" &&
      direction.x !== -1
    ) {
      direction = { x: 1, y: 0 };
    }
  }
);

function loop() {
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= 20 ||
    head.y >= 20 ||
    snake.some(
      part =>
        part.x === head.x &&
        part.y === head.y
    )
  ) {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];

    direction = {
      x: 1,
      y: 0
    };

    score = 0;
    scoreElement.textContent = score;

    return draw();
  }

  snake.unshift(head);

  if (
    head.x === food.x &&
    head.y === food.y
  ) {
    score++;

    scoreElement.textContent =
      score;

    food = {
      x: Math.floor(
        Math.random() * 20
      ),
      y: Math.floor(
        Math.random() * 20
      )
    };
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  ctx.fillStyle = "#ffffff";

  snake.forEach(part => {
    ctx.fillRect(
      part.x * size,
      part.y * size,
      size - 1,
      size - 1
    );
  });

  ctx.fillStyle = "#777777";

  ctx.fillRect(
    food.x * size,
    food.y * size,
    size - 1,
    size - 1
  );
}

draw();

setInterval(
  loop,
  110
);
        `.trim()
      },

      {
        id: "quiz-game",
        name: "Quiz Game",
        description:
          "Simple multiple-choice quiz starter.",
        category: "games",
        type: "game",
        tags: ["Quiz", "Game", "JavaScript"],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz</title>
</head>
<body>

  <main class="quiz">

    <div id="quiz">
      <h1 id="question"></h1>
      <div id="answers"></div>
    </div>

    <div id="result" hidden>
      <h2>Finished</h2>
      <p>
        Score:
        <strong id="score">0</strong>
      </p>
      <button id="restart">
        Restart
      </button>
    </div>

  </main>

</body>
</html>
        `.trim(),

        css: `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b0b0c;
  color: white;
  font-family: Inter, system-ui, sans-serif;
}

.quiz {
  width: min(100% - 32px, 600px);
  padding: 24px;
  border: 1px solid #29292d;
  border-radius: 14px;
}

#answers {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.answer {
  padding: 14px;
  border: 1px solid #29292d;
  background: #141416;
  color: white;
  border-radius: 9px;
  text-align: left;
  cursor: pointer;
}

.answer:hover {
  border-color: #555;
}

button {
  padding: 12px 18px;
  border: 0;
  border-radius: 9px;
  background: white;
  color: #111;
}
        `.trim(),

        js: `
const questions = [
  {
    question: "Which language styles a webpage?",
    answers: [
      "HTML",
      "CSS",
      "SQL",
      "Python"
    ],
    correct: 1
  },
  {
    question: "Which language adds interaction?",
    answers: [
      "CSS",
      "HTML",
      "JavaScript",
      "XML"
    ],
    correct: 2
  },
  {
    question: "Which element contains JavaScript?",
    answers: [
      "<script>",
      "<style>",
      "<js>",
      "<code>"
    ],
    correct: 0
  }
];

let index = 0;
let score = 0;

const question =
  document.getElementById(
    "question"
  );

const answers =
  document.getElementById(
    "answers"
  );

function render() {
  if (
    index >= questions.length
  ) {
    document.getElementById(
      "quiz"
    ).hidden = true;

    document.getElementById(
      "result"
    ).hid
