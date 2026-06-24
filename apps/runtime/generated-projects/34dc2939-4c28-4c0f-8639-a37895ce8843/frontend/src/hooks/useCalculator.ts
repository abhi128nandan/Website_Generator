export const useCalculator = () => {
  const [displayValue, setDisplayValue] = React.useState<string>('0');
  const [previousValue, setPreviousValue] = React.useState<string | null>(null);
  const [operator, setOperator] = React.useState<string | null>(null);
  const [waitingForNextValue, setWaitingForNextValue] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const inputDigit = useCallback((digit: string) => {
    if (error) setError(null);

    if (waitingForNextValue) {
      setDisplayValue(digit);
      setWaitingForNextValue(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  }, [displayValue, waitingForNextValue, error]);

  const inputDecimal = useCallback(() => {
    if (error) setError(null);

    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, error]);

  const handleOperator = useCallback((nextOperator: string) => {
    if (error) setError(null);

    const inputValue = parseFloat(displayValue);

    if (previousValue === null) {
      setPreviousValue(displayValue);
      setDisplayValue('0');
    } else if (operator) {
      const currentValue = parseFloat(displayValue);
      const result = calculate(parseFloat(previousValue), currentValue, operator);
      setDisplayValue(`${result}`);
      setPreviousValue(`${result}`);
    }

    setWaitingForNextValue(true);
    setOperator(nextOperator);
  }, [displayValue, previousValue, operator, error]);

  const handleEquals = useCallback(() => {
    if (error) setError(null);

    if (previousValue === null || operator === null) {
      return;
    }

    const currentValue = parseFloat(displayValue);
    const result = calculate(parseFloat(previousValue), currentValue, operator);

    if (isNaN(result)) {
      setError('Error: Invalid calculation');
      return;
    }

    setDisplayValue(`${result}`);
    setPreviousValue(null);
    setOperator(null);
  }, [displayValue, previousValue, operator, error]);

  const handleClear = useCallback(() => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNextValue(false);
    setError(null);
  }, []);

  const calculate = (prevValue: number, currentValue: number, op: string): number => {
    switch (op) {
      case '+':
        return prevValue + currentValue;
      case '-':
        return prevValue - currentValue;
      case '*':
        return prevValue * currentValue;
      case '/':
        return currentValue !== 0 ? prevValue / currentValue : Infinity;
      default:
        return currentValue;
    }
  };

  return {
    displayValue,
    error,
    inputDigit,
    inputDecimal,
    handleOperator,
    handleEquals,
    handleClear
  };
};