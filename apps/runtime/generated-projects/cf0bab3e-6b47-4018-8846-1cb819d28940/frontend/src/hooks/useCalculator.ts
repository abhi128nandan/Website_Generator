export function useCalculator() {
  const [display, setDisplay] = useState<string>('0');
  const [currentValue, setCurrentValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleNumberInput = useCallback((number: string) => {
    if (display === '0' && number === '.') {
      setDisplay('0.');
      return;
    }

    if (display === '0') {
      setDisplay(number);
    } else {
      setDisplay(display + number);
    }
  }, [display]);

  const handleOperator = useCallback((op: string) => {
    setError(null);

    if (currentValue === null) {
      setCurrentValue(display);
      setOperation(op);
      setDisplay('0');
    } else {
      if (previousValue !== null && operation !== null) {
        try {
          const result = calculate(previousValue, display, operation);
          setCurrentValue(result);
          setOperation(op);
          setDisplay('0');
        } catch (e) {
          setError('Error in previous operation');
        }
      } else {
        setOperation(op);
        setDisplay('0');
      }
    }

    setPreviousValue(display);
  }, [currentValue, display, operation, previousValue]);

  const handleEquals = useCallback(() => {
    if (currentValue !== null && operation !== null && previousValue !== null) {
      try {
        const result = calculate(currentValue, display, operation);
        setDisplay(result);
        setCurrentValue(result);
        setOperation(null);
        setPreviousValue(null);
      } catch (e) {
        setError('Invalid operation');
      }
    }
  }, [currentValue, display, operation, previousValue]);

  const clearCalculator = useCallback(() => {
    setDisplay('0');
    setCurrentValue(null);
    setOperation(null);
    setPreviousValue(null);
    setError(null);
  }, []);

  const calculate = (a: string, b: string, op: string): string => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Invalid numbers');
    }

    let result: number;

    switch (op) {
      case '+':
        result = numA + numB;
        break;
      case '-':
        result = numA - numB;
        break;
      case '*':
        result = numA * numB;
        break;
      case '/':
        if (numB === 0) {
          throw new Error('Division by zero');
        }
        result = numA / numB;
        break;
      default:
        throw new Error('Invalid operation');
    }

    return result.toString();
  };

  return {
    display,
    error,
    handleNumberInput,
    handleOperator,
    handleEquals,
    clearCalculator,
  };
}