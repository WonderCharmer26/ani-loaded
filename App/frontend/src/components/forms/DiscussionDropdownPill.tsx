import { ChevronDown } from "lucide-react";

type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DiscussionDropdownPillProps = {
  id: string;
  prefix: string;
  label: string;
  value: string;
  // short text shown in the pill, the full option labels show in the picker
  displayValue: string;
  options: DropdownOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

// compact "S 1" / "EP 26" pill that opens the native select picker
export default function DiscussionDropdownPill({
  id,
  prefix,
  label,
  value,
  displayValue,
  options,
  disabled = false,
  onChange,
}: DiscussionDropdownPillProps) {
  return (
    <label
      htmlFor={id}
      className={`relative flex h-7.5 items-center gap-1.5 rounded-lg border border-[#2A3342] pr-2 pl-2.5 transition-colors focus-within:border-[#4DA3F0] ${
        disabled ? "opacity-50" : "cursor-pointer hover:border-[#3A4659]"
      }`}
    >
      <span className="font-geist-mono text-xs/4.5 text-[#6B7688]">
        {prefix}
      </span>
      <span
        className={`min-w-[2ch] font-geist-mono text-[13px]/4.5 font-semibold ${
          value ? "text-[#F3F5F9]" : "text-[#4A5262]"
        }`}
      >
        {displayValue}
      </span>
      <ChevronDown className="size-3.5 text-[#6B7688]" strokeWidth={2} />

      {/* invisible native select on top keeps the real picker and keyboard support */}
      <select
        id={id}
        name={id}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-[#141922] text-[#E4E8F0]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
