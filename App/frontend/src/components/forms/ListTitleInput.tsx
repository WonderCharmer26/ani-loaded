interface ListTitleInputProps {
  value: string;
  onChange: (value: string) => void;
}

// Inline editable title — styled to match the TopAnimeShowcase heading
export default function ListTitleInput({
  value,
  onChange,
}: ListTitleInputProps) {
  return (
    <div className="mb-1 flex flex-col">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter Title"
        maxLength={80}
        className="font-bold text-[32px] text-white leading-tight bg-transparent border-b-2 border-transparent focus:border-slate-500 focus:outline-none w-full placeholder-slate-600 transition-colors"
        aria-label="List title"
      />
      {/* <p className="font-medium text-[20px] flex justify-start text-[#9a9a9a] tracking-wide mt-0.5"> */}
      {/*   TOP ANIME */}
      {/* </p> */}
    </div>
  );
}
