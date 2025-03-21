export function Slider({ value, min, max, step, onValueChange }) {
    return (
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange([parseInt(e.target.value)])}
        className="w-full"
      />
    );
  }
  