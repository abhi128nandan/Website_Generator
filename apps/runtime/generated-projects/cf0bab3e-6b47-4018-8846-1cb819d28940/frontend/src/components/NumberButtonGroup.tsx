import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useCalculatorContext } from "@/context/CalculatorContext";

interface NumberButtonGroupProps {
  className?: string;
}

export default function NumberButtonGroup({ className }: NumberButtonGroupProps) {
  const { input, setInput } = useCalculatorContext();

  const handleClick = (value: string) => {
    setInput((prev) => prev + value);
  };

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
        <Button
          key={num}
          onClick={() => handleClick(num.toString())}
          className="h-14 text-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {num}
        </Button>
      ))}
    </div>
  );
}