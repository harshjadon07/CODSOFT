/**
 * Glassmorphic Calculator Core Logic
 * Fully custom tokenizer & math parser implementing operator precedence (Shunting-Yard)
 * Includes keyboard binding, theme management, and active tactile feedbacks
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const calcDisplay = document.getElementById('calcDisplay');
  const calcHistory = document.getElementById('calcHistory');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  
  // --- App State ---
  let currentInput = ""; // Stores the raw equation string, e.g., "3*-5"
  let isCalculated = false; // Tracks if the screen is showing a final result

  // --- Web Audio Click Sound ---
  let audioCtx = null;
  function playClickSound() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {
      // Audio blocked or not supported
    }
  }

  // --- Theme Management ---
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  
  if (savedTheme === 'light' || (!savedTheme && systemPrefersLight)) {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  }

  themeToggleBtn.addEventListener('click', () => {
    playClickSound();
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    }
  });

  // --- Custom Math Tokenizer ---
  function tokenize(str) {
    const tokens = [];
    let currentToken = "";
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      // Check if character is a digit or decimal point
      if ((char >= '0' && char <= '9') || char === '.') {
        currentToken += char;
      } else if (['+', '-', '*', '/', '(', ')'].includes(char)) {
        // If there's a token in progress, push it
        if (currentToken !== "") {
          tokens.push(currentToken);
          currentToken = "";
        }
        
        // Handle negative number sign
        if (char === '-') {
          const lastToken = tokens[tokens.length - 1];
          // Negative sign conditions:
          // 1. Beginning of expression
          // 2. Preceded by another operator or '('
          const isNegativeSign = tokens.length === 0 || 
                                 ['+', '-', '*', '/', '('].includes(lastToken);
          
          if (isNegativeSign) {
            currentToken = "-";
            continue;
          }
        }
        
        tokens.push(char);
      }
    }
    
    if (currentToken !== "") {
      tokens.push(currentToken);
    }
    
    return tokens.filter(t => t !== "");
  }

  // --- Custom Math Evaluator (Shunting-Yard + RPN Stack Evaluation) ---
  const PRECEDENCE = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2
  };

  function evaluateTokens(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    
    // 1. Shunting-Yard algorithm to convert infix to postfix notation (RPN)
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      if (!isNaN(Number(token))) {
        // If it's a number, push to output
        outputQueue.push(Number(token));
      } else if (['+', '-', '*', '/'].includes(token)) {
        // Operator
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1] !== '(' &&
          PRECEDENCE[operatorStack[operatorStack.length - 1]] >= PRECEDENCE[token]
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        let foundOpenParen = false;
        while (operatorStack.length > 0) {
          const op = operatorStack.pop();
          if (op === '(') {
            foundOpenParen = true;
            break;
          }
          outputQueue.push(op);
        }
        if (!foundOpenParen) {
          throw new Error("Mismatched Parentheses");
        }
      }
    }
    
    while (operatorStack.length > 0) {
      const op = operatorStack.pop();
      if (op === '(' || op === ')') {
        throw new Error("Mismatched Parentheses");
      }
      outputQueue.push(op);
    }

    // 2. Postfix Stack Evaluation
    const evalStack = [];
    for (let i = 0; i < outputQueue.length; i++) {
      const token = outputQueue[i];
      
      if (typeof token === 'number') {
        evalStack.push(token);
      } else {
        const b = evalStack.pop();
        const a = evalStack.pop();
        
        if (a === undefined || b === undefined) {
          throw new Error("Syntax Error");
        }
        
        let val;
        if (token === '+') val = a + b;
        else if (token === '-') val = a - b;
        else if (token === '*') val = a * b;
        else if (token === '/') {
          if (b === 0) {
            throw new Error("Cannot divide by 0");
          }
          val = a / b;
        }
        
        evalStack.push(val);
      }
    }
    
    if (evalStack.length !== 1) {
      throw new Error("Syntax Error");
    }
    
    return evalStack[0];
  }

  // --- Display Formatter ---
  function formatExpression(expr) {
    if (expr === "") return "0";
    try {
      const tokens = tokenize(expr);
      let formatted = "";
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '+') formatted += ' + ';
        else if (token === '-') formatted += ' − ';
        else if (token === '*') formatted += ' × ';
        else if (token === '/') formatted += ' ÷ ';
        else if (token === '(') {
          // Add spacing if preceded by non-operator
          if (i > 0 && !['+', '-', '*', '/', '('].includes(tokens[i-1])) {
            formatted += ' (';
          } else {
            formatted += '(';
          }
        }
        else if (token === ')') formatted += ')';
        else {
          // If the number is negative, e.g. "-3", display nicely as "−3"
          if (token.startsWith('-')) {
            formatted += '−' + token.slice(1);
          } else {
            formatted += token;
          }
        }
      }
      return formatted;
    } catch (e) {
      // Fallback
      return expr.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/-/g, ' − ');
    }
  }

  function updateDisplay() {
    calcDisplay.textContent = formatExpression(currentInput);
    // Auto-scroll the display to the right so user sees the latest input
    calcDisplay.scrollLeft = calcDisplay.scrollWidth;
  }

  // --- Decimal Prevention Helper ---
  function canAppendDecimal(expr) {
    // Find the last segment which doesn't contain operators or parentheses
    const parts = expr.split(/[\+\-\*\/ \(\)]/);
    const lastPart = parts[parts.length - 1];
    return !lastPart.includes('.');
  }

  // --- Input Handlers ---
  function handleDigit(digit) {
    if (isCalculated) {
      currentInput = "";
      isCalculated = false;
    }
    
    // Prevent starting with multiple zeros
    if (currentInput === "0" && digit === "0") return;
    if (currentInput === "0" && digit !== "0" && digit !== ".") {
      currentInput = digit; // Replace leading single zero
    } else {
      currentInput += digit;
    }
    updateDisplay();
  }

  function handleDecimal() {
    if (isCalculated) {
      currentInput = "0";
      isCalculated = false;
    }
    
    const lastChar = currentInput.slice(-1);
    if (currentInput === "" || ['+', '-', '*', '/', '('].includes(lastChar)) {
      currentInput += "0.";
    } else if (canAppendDecimal(currentInput)) {
      currentInput += ".";
    }
    updateDisplay();
  }

  function handleOperator(op) {
    if (isCalculated) {
      isCalculated = false; // Continue from previous result
    }
    
    if (currentInput === "") {
      if (op === '-') {
        currentInput = "-";
        updateDisplay();
      }
      return; // Do not allow other operators at start
    }
    
    const lastChar = currentInput.slice(-1);
    const secondLastChar = currentInput.slice(-2, -1);
    const operators = ['+', '-', '*', '/'];
    
    if (operators.includes(lastChar)) {
      if (op === '-') {
        // Allow negative sign after multiplying/dividing, e.g. "5 * -"
        if (lastChar !== '-' && lastChar !== '+') {
          currentInput += op;
        }
      } else {
        // Replace operators
        if (operators.includes(secondLastChar)) {
          // If we had two operators (e.g. "5 * -"), slice off both
          currentInput = currentInput.slice(0, -2) + op;
        } else {
          currentInput = currentInput.slice(0, -1) + op;
        }
      }
    } else if (lastChar === '(') {
      if (op === '-') {
        currentInput += op; // Negative sign inside paren, e.g. "(-"
      }
    } else {
      currentInput += op;
    }
    updateDisplay();
  }

  function handleParenthesis(paren) {
    if (isCalculated) {
      currentInput = "";
      isCalculated = false;
    }
    
    const lastChar = currentInput.slice(-1);
    
    if (paren === '(') {
      // Auto multiply if preceded by number or close parenthesis, e.g., "5(" -> "5*("
      if (lastChar !== "" && (!['+', '-', '*', '/', '('].includes(lastChar))) {
        currentInput += '*(';
      } else {
        currentInput += '(';
      }
    } else if (paren === ')') {
      const openCount = (currentInput.match(/\(/g) || []).length;
      const closeCount = (currentInput.match(/\)/g) || []).length;
      
      if (openCount > closeCount && lastChar !== '(') {
        currentInput += ')';
      }
    }
    updateDisplay();
  }

  function handleClear() {
    currentInput = "";
    calcHistory.textContent = "";
    calcDisplay.textContent = "0";
    isCalculated = false;
  }

  function handleDelete() {
    if (isCalculated) {
      handleClear();
      return;
    }
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
  }

  function calculate() {
    if (currentInput === "") return;
    
    let cleanInput = currentInput;
    
    // Remove any trailing operators
    const operators = ['+', '-', '*', '/'];
    while (cleanInput.length > 0 && operators.includes(cleanInput.slice(-1))) {
      cleanInput = cleanInput.slice(0, -1);
    }
    
    // Automatically close open parentheses
    const openCount = (cleanInput.match(/\(/g) || []).length;
    const closeCount = (cleanInput.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      cleanInput += ')'.repeat(openCount - closeCount);
    }
    
    if (cleanInput === "") {
      handleClear();
      return;
    }
    
    try {
      const tokens = tokenize(cleanInput);
      const result = evaluateTokens(tokens);
      
      if (!isFinite(result)) {
        if (isNaN(result)) {
          throw new Error("Invalid Format");
        } else {
          throw new Error("Cannot divide by 0");
        }
      }
      
      // Trim precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
      let displayResult = result.toString();
      if (displayResult.includes('.') && displayResult.length > 12) {
        const rounded = Math.round(result * 1e10) / 1e10;
        displayResult = rounded.toString();
      }
      
      calcHistory.textContent = formatExpression(cleanInput) + " =";
      calcDisplay.textContent = formatExpression(displayResult);
      
      currentInput = displayResult;
      isCalculated = true;
    } catch (e) {
      calcHistory.textContent = formatExpression(cleanInput);
      calcDisplay.textContent = e.message || "Error";
      currentInput = ""; // Reset input so user starts fresh
      isCalculated = true;
    }
    calcDisplay.scrollLeft = calcDisplay.scrollWidth;
  }

  // --- Button Action Mapper ---
  const keypad = document.querySelector('.keypad-section');
  keypad.addEventListener('click', (e) => {
    const target = e.target.closest('.btn');
    if (!target) return;
    
    playClickSound();
    
    const value = target.getAttribute('data-value');
    const action = target.getAttribute('data-action');
    
    if (action === null) {
      // Number or Decimal input
      if (value === '.') {
        handleDecimal();
      } else {
        handleDigit(value);
      }
    } else if (action === 'operator') {
      handleOperator(value);
    } else if (action === 'paren-open') {
      handleParenthesis('(');
    } else if (action === 'paren-close') {
      handleParenthesis(')');
    } else if (action === 'clear') {
      handleClear();
    } else if (action === 'delete') {
      handleDelete();
    } else if (action === 'calculate') {
      calculate();
    }
  });

  // --- Physical Keyboard Integration ---
  document.addEventListener('keydown', (e) => {
    let key = e.key;
    
    // Map keys to the appropriate function
    if (key >= '0' && key <= '9') {
      triggerBtnVisualState(key);
      handleDigit(key);
    } else if (key === '.') {
      triggerBtnVisualState('.');
      handleDecimal();
    } else if (key === '+') {
      triggerBtnVisualState('+');
      handleOperator('+');
    } else if (key === '-') {
      triggerBtnVisualState('-');
      handleOperator('-');
    } else if (key === '*') {
      triggerBtnVisualState('*');
      handleOperator('*');
    } else if (key === '/') {
      e.preventDefault(); // Prevent page search trigger in some browsers
      triggerBtnVisualState('/');
      handleOperator('/');
    } else if (key === '(') {
      triggerBtnVisualState('(');
      handleParenthesis('(');
    } else if (key === ')') {
      triggerBtnVisualState(')');
      handleParenthesis(')');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      triggerBtnVisualState('=');
      handleKeyboardClick();
      calculate();
    } else if (key === 'Backspace') {
      triggerBtnVisualState('DEL');
      handleKeyboardClick();
      handleDelete();
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
      triggerBtnVisualState('AC');
      handleKeyboardClick();
      handleClear();
    }
  });

  function handleKeyboardClick() {
    playClickSound();
  }

  // Visual click response on keyboard presses
  function triggerBtnVisualState(keyLabel) {
    let btn = null;
    
    if (keyLabel === '.') {
      btn = document.getElementById('btnDecimal');
    } else if (keyLabel === '+') {
      btn = document.getElementById('btnPlus');
    } else if (keyLabel === '-') {
      btn = document.getElementById('btnSubtract');
    } else if (keyLabel === '*') {
      btn = document.getElementById('btnMultiply');
    } else if (keyLabel === '/') {
      btn = document.getElementById('btnDivide');
    } else if (keyLabel === '(') {
      btn = document.getElementById('btnOpenParen');
    } else if (keyLabel === ')') {
      btn = document.getElementById('btnCloseParen');
    } else if (keyLabel === '=') {
      btn = document.getElementById('btnEquals');
    } else if (keyLabel === 'DEL') {
      btn = document.getElementById('btnDelete');
    } else if (keyLabel === 'AC') {
      btn = document.getElementById('btnAC');
    } else {
      // Number keys
      btn = document.getElementById(`btn${keyLabel}`);
    }
    
    if (btn) {
      btn.classList.add('active');
      btn.style.transform = "scale(0.92)";
      btn.style.filter = "brightness(0.85)";
      
      setTimeout(() => {
        btn.classList.remove('active');
        btn.style.transform = "";
        btn.style.filter = "";
      }, 100);
    }
  }
});
