import { Link } from "react-router-dom";

interface LinkButtonProps {
  word: string;
  link: string;
  colorClass?: string;
  className?: string;
}

export default function LinkButton({
  word,
  link,
  colorClass = "bg-black text-white",
  className = "",
}: LinkButtonProps) {
  const baseClass =
    `inline-block py-2.5 px-5 font-bold rounded-3xl ${colorClass} ${className}`
      .toLowerCase()
      .trim();

  return (
    <div>
      <Link to={link} className={baseClass}>
        {word}
      </Link>
    </div>
  );
}
