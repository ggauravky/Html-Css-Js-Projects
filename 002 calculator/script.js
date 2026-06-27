class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
        this.setupEventListeners();
    }

    // Initialize calculator state
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetDisplay = false;
    }

    // Delete last entered character
    delete() {
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.toString().slice(0, -1);
        }
    }

    // Add number to display
    appendNumber(number) {
        // Handle decimal point
        if (number === '.' && this.currentOperand.includes('.')) return;
        
        // Reset display if needed
        if (this.shouldResetDisplay) {
            this.currentOperand = '0';
            this.shouldResetDisplay = false;
        }
        
        // Handle leading zero
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    // Choose operation
    chooseOperation(operation) {
        if (this.currentOperand === '' || this.currentOperand === null) return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.shouldResetDisplay = true;
    }

    // Perform calculation
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        
        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
            case '-':
                computation = prev - current;
                break;
            case '×':
            case '*':
                computation = prev * current;
                break;
            case '÷':
            case '/':
                if (current === 0) {
                    alert('Cannot divide by zero');
                    return;
                }
                computation = prev / current;
                break;
            case '%':
                computation = prev % current;
                break;
            default:
                return;
        }

        this.currentOperand = this.roundResult(computation).toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetDisplay = true;
    }

    // Calculate percentage
    percentage() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;
        this.currentOperand = (current / 100).toString();
    }

    // Round result to avoid floating point errors
    roundResult(number) {
        return Math.round((number + Number.EPSILON) * 1000000000000) / 1000000000000;
    }

    // Format number for display
    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', {
                maximumFractionDigits: 0
            });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    // Update display
    updateDisplay() {
        this.currentOperandElement.innerText = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            this.previousOperandElement.innerText = 
                `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            this.previousOperandElement.innerText = '';
        }
    }

    // Add visual feedback for button presses
    addButtonFeedback(button) {
        button.classList.add('pressed');
        setTimeout(() => {
            button.classList.remove('pressed');
        }, 100);
    }

    // Setup all event listeners
    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('[data-number]').forEach(button => {
            button.addEventListener('click', (e) => {
                this.addButtonFeedback(button);
                this.appendNumber(button.innerText);
                this.updateDisplay();
            });
        });

        // Operator buttons
        document.getElementById('add').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.chooseOperation('+');
            this.updateDisplay();
        });

        document.getElementById('subtract').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.chooseOperation('−');
            this.updateDisplay();
        });

        document.getElementById('multiply').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.chooseOperation('×');
            this.updateDisplay();
        });

        document.getElementById('divide').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.chooseOperation('÷');
            this.updateDisplay();
        });

        // Function buttons
        document.getElementById('equals').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.compute();
            this.updateDisplay();
        });

        document.getElementById('clear').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.clear();
            this.updateDisplay();
        });

        document.getElementById('delete').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.delete();
            this.updateDisplay();
        });

        document.getElementById('decimal').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.appendNumber('.');
            this.updateDisplay();
        });

        document.getElementById('percentage').addEventListener('click', (e) => {
            this.addButtonFeedback(e.target);
            this.percentage();
            this.updateDisplay();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key >= '0' && e.key <= '9') {
                this.appendNumber(e.key);
                this.updateDisplay();
                this.highlightKey(`[data-number="${e.key}"]`);
            }
            
            if (e.key === '.') {
                this.appendNumber('.');
                this.updateDisplay();
                this.highlightKey('#decimal');
            }
            
            if (e.key === '+') {
                this.chooseOperation('+');
                this.updateDisplay();
                this.highlightKey('#add');
            }
            
            if (e.key === '-') {
                this.chooseOperation('−');
                this.updateDisplay();
                this.highlightKey('#subtract');
            }
            
            if (e.key === '*') {
                this.chooseOperation('×');
                this.updateDisplay();
                this.highlightKey('#multiply');
            }
            
            if (e.key === '/') {
                e.preventDefault();
                this.chooseOperation('÷');
                this.updateDisplay();
                this.highlightKey('#divide');
            }
            
            if (e.key === 'Enter' || e.key === '=') {
                this.compute();
                this.updateDisplay();
                this.highlightKey('#equals');
            }
            
            if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                this.clear();
                this.updateDisplay();
                this.highlightKey('#clear');
            }
            
            if (e.key === 'Backspace') {
                this.delete();
                this.updateDisplay();
                this.highlightKey('#delete');
            }
            
            if (e.key === '%') {
                this.percentage();
                this.updateDisplay();
                this.highlightKey('#percentage');
            }
        });
    }

    // Highlight key when pressed via keyboard
    highlightKey(selector) {
        const key = document.querySelector(selector);
        if (key) {
            this.addButtonFeedback(key);
        }
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const previousOperandElement = document.getElementById('previous-operand');
    const currentOperandElement = document.getElementById('current-operand');
    
    const calculator = new Calculator(previousOperandElement, currentOperandElement);
    calculator.updateDisplay();
    
    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in-out';
        document.body.style.opacity = '1';
    }, 100);
});

// Add touch support for mobile devices
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, true);
}

// Prevent zoom on double tap for iOS
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);
