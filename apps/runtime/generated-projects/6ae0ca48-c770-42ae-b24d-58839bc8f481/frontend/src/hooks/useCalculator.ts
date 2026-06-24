export const useCalculator = () => {
  const [display, setDisplay] = useState<string>('0');
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [previousValue, setPreviousValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const appendDigit = useCallback((digit: string) => {
    if (display === '0' && digit === '0') return;
    if (display === '0' && digit !== '.') {
      setDisplay(digit);
    } else {
      setDisplay(display + digit);
    }
  }, [display]);

  const appendDecimal = useCallback(() => {
    if (display.includes('.')) return;
    setDisplay(display + '.');
  }, [display]);

  const handleOperation = useCallback((operation: string) => {
    if (!previousValue) {
      setPreviousValue(parseFloat(display));
    } else if (pendingOperation) {
      let result;
      switch (pendingOperation) {
        case '+':
          result = previousValue + currentValue;
          break;
        case '-':
          result = previousValue - currentValue;
          break;
        case '*':
          result = previousValue * currentValue;
          break;
        case '/':
          result = previousValue / currentValue;
          break;
      }
      setPreviousValue(result);
      setCurrentValue(0);
      setDisplay(result.toString());
      setError(null);
    }
    setCurrentValue(parseFloat(display));
    setPendingOperation(operation);
    setDisplay('0');
  }, [display, currentValue, previousValue, pendingOperation]);

  const calculateResult = useCallback(() => {
    if (!pendingOperation || !currentValue) return;

    try {
      let result;
      switch (pendingOperation) {
        case '+':
          result = previousValue + currentValue;
          break;
        case '-':
          result = previousValue - currentValue;
          break;
        case '*':
          result = previousValue * currentValue;
          break;
        case '/':
          if (currentValue === 0) {
            throw new Error('Division by zero');
          }
          result = previousValue / currentValue;
          break;
        default:
          throw new Error('Invalid operation');
      }

      setDisplay(result.toString());
      setCurrentValue(0);
      setPendingOperation(null);
      setError(null);
    } catch (error) {
      setError('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [pendingOperation, currentValue, previousValue]);

  const clearDisplay = useCallback(() => {
    setDisplay('0');
    setCurrentValue(0);
    setPreviousValue(0);
    setPendingOperation(null);
    setError(null);
  }, []);

  return {
    display,
    error,
    appendDigit,
    appendDecimal,
    handleOperation,
    calculateResult,
    clearDisplay
  };
};