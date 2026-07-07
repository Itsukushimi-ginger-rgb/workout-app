import { useRef } from 'react';

interface NumberInputProps {
  value: number | '';
  onChange: (value: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  label?: string;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  placeholder = '0',
  unit,
  label,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-xs text-gray-500">{label}</span>}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          inputMode="decimal"
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? '' : parseFloat(v));
          }}
          onFocus={() => inputRef.current?.select()}
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg text-right focus:outline-none focus:border-blue-500 min-h-[48px]"
        />
        {unit && <span className="text-sm text-gray-500 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}
