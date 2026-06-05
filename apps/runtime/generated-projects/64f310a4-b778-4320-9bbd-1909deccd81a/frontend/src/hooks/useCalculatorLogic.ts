<think>
Okay, let's tackle this problem. I need to create a custom React hook called useCalculatorLogic for a simple calculator app. The hook should manage the calculation state, handle arithmetic operations, and validate inputs with error handling. Let's break down the requirements step by step.

First, the calculator needs to handle basic operations: addition, subtraction, multiplication, division. It also has numeric buttons (0-9), operator buttons, a display screen, clear and delete functions, and decimal support. The hook must be self-contained with React hooks like useState, useEffect, useCallback. No services or external modules are allowed.

Let me think about the state variables needed. The display should show the current input or result. Maybe a currentInput and a previousInput to track the numbers and the operator. Also, an error state to handle invalid operations like division by zero.

So, initial state could be:
- currentInput: string, starts as '0'
- previousInput: string, empty initially
- operator: string or null
- error: string, empty initially

For the functions, I need to handle number input, decimal points, operators, clear, delete, and calculate.

When a number is pressed, it should update the currentInput. If the input is empty or starts with a '0' and the new digit isn't a decimal, handle leading zeros. For example, pressing 0 first then another 0 should just be 0, but if the user starts with 0 and then adds a decimal, like 0. and then more digits.

The decimal point should be allowed only once per number. So when adding a decimal, check if the currentInput already has one.

For operators, when the user selects an operator, we need to set the previousInput to the currentInput, store the operator, and reset currentInput for the next number. But if there's already a previousInput, maybe we need to calculate the result first before storing the new operator.

The calculate function would perform the operation between previousInput and currentInput. Need to handle division by zero here, which would set an error.

The clear function resets all states. Delete would remove the last character from currentInput.

Error handling: When an error occurs, like division by zero, display the error message and prevent further operations until cleared.

Now, how to structure the hook. Using useState for the states mentioned. Then, functions to handle each action.

Let me outline the functions:

1. handleNumberInput: appends the number to currentInput, handling leading zeros and decimals.
2. handleDecimal: adds a decimal point if not already present.
3. handleOperator: sets the operator and moves currentInput to previousInput, if previousInput exists, maybe calculate first.
4. handleCalculate: performs the calculation based on the operator, updates previousInput and currentInput.
5. handleClear: resets everything.
6. handleDelete: removes the last character from currentInput.

For the state management, using useState for currentInput, previousInput, operator, and error.

Now, the calculate function needs to parse the previous and current inputs as numbers. But what if the inputs are empty or invalid? Need to validate.

Also, after a calculation, if the user enters another operator, the result becomes the previousInput and the new operator is set. For example, 5 + 3 = 8, then entering * 2 would calculate 8 * 2.

Edge cases: leading zeros, multiple decimals, division by zero, consecutive operators, etc.

Let me think about the initial state. currentInput is '0', previousInput is empty, operator is null.

For example, when the user presses 5, currentInput becomes '5'. Then +, previous becomes '5', operator '+', currentInput reset to empty. Then 3, currentInput becomes '3'. Pressing =, calculate 5 + 3 = 8. Then pressing * 2 and = should calculate 8 * 2 = 16.

But maybe the user can press multiple operators. Like 5 + + 3. In that case, the second '+' should replace the previous operator.

Wait, in real calculators, consecutive operators usually replace the previous one. So if the user has 5 + and then presses -, it becomes 5 - ... So in the handleOperator function, if previousInput already exists, and operator is set, maybe we need to just update the operator.

Let me structure the handleOperator function. When an operator is pressed:

- If previousInput is not set (i.e., first time), set previousInput to currentInput, reset currentInput, and set the operator.
- If previousInput is already set, maybe the user is entering a new operator. For example, after entering 5 +, then entering *, we should update the operator to * without calculating yet. But if the user enters another number after that, then we can proceed.

Alternatively, if the user enters two operators in a row, the second one should replace the first. For example, 5 ++3 is 5 +3.

So in handleOperator, if there's already an operator, we just replace it. Also, if currentInput is empty (like after an operator was pressed and then another operator is pressed), we might need to handle that.

Another case: if the previousInput is set and the currentInput is empty (because the user pressed an operator without entering a number), then pressing an operator again should just update the operator.

So, the handleOperator function needs to check if previousInput is set and if the currentInput is empty. If so, just update the operator. Otherwise, proceed to set previousInput and reset currentInput.

Wait, maybe the handleOperator function is called when the user selects an operator. So if there's already a previousInput and an operator, and the user selects a new operator, that would mean that the previous operator hasn't been used yet. For example, 5 +, then pressing * would mean that the user intended to perform 5 * ... So the existing previousInput (5) is kept, the operator is updated to *, and currentInput is reset.

But in reality, consecutive operators are usually treated as the last one. So if you press 5 + +, it's treated as 5 + ... So the first '+' sets the operator, and the second '+' would be another operator. However, in this case, the currentInput is empty. So maybe when the user presses another operator when currentInput is empty, we should replace the operator.

So the logic for handleOperator:

- If previousInput is not set (i.e., first operator pressed), then set previousInput to currentInput, reset currentInput, and set the operator.
- Else, if currentInput is empty (meaning user pressed operator again without entering a number), replace the operator.
- Else, proceed with the calculation using the previous operator, then set the new operator.

Wait, but if the user presses operator again, maybe they want to chain operations. For example, 5 + 3 + 2. So after 5 + 3, pressing + would calculate 5+3=8, and then the operator is set to +, waiting for the next number. So in that case, after calculating, pressing another operator would set the operator.

So perhaps, when