export function useCalculator() {
  const [currentInput, setCurrentInput] = useState<string>('');
  const [previousInput, setPreviousInput] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);

  const calculate = useCallback(() => {
    if (!previousInput || !currentInput || !operator) return;

    const prevNum = parseFloat(previousInput);
    const currNum = parseFloat(currentInput);

    let calcResult: number;

    switch (operator) {
      case '+':
        calcResult = prevNum + currNum;
        break;
      case '-':
        calcResult = prevNum - currNum;
        break;
      case '*':
        calcResult = prevNum * currNum;
        break;
      case '/':
        calcResult = prevNum / currNum;
        break;
      default:
        return;
    }

    setResult(calcResult.toString());
  }, [currentInput, previousInput, operator]);

  const handleNumberInput = useCallback((number: string) => {
    setCurrentInput(currentInput + number);
    setResult(null);
  }, [currentInput]);

  const handleOperatorInput = useCallback((op: string) => {
    if (currentInput === '') return;
    if (previousInput === '' && result === null) {
      setPreviousInput(currentInput);
      setCurrentInput('');
    } else if (result !== null) {
      setPreviousInput(result);
      setCurrentInput('');
    } else {
      calculate();
      setOperator(op);
      setPreviousInput(result || previousInput);
      setCurrentInput('');
    }
    setOperator(op);
  }, [currentInput, previousInput, result, calculate]);

  const handleEquals = useCallback(() => {
    if (previousInput && currentInput && operator) {
      calculate();
    }
  }, [previousInput, currentInput, operator, calculate]);

  const handleClear = useCallback(() => {
    setCurrentInput('');
    setPreviousInput('');
    setOperator('');
    setResult(null);
  }, []);

  return {
    currentInput,
    previousInput,
    result,
    handleNumberInput,
    handleOperatorInput,
    handleEquals,
    handleClear,
  };
}