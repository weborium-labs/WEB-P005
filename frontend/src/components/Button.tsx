interface ButtonProps {
  text: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 h-12 text-[17px] font-normal text-white " +
  "bg-[radial-gradient(120%_140%_at_0%_100%,#7b97ff_0%,rgba(123,151,255,0)_55%),linear-gradient(90deg,#4560f0_0%,#2f4fe6_100%)] " +
  "shadow-[0_6px_16px_rgba(47,79,230,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] " +
  "transition-all duration-300 hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4fe6]/50 focus-visible:ring-offset-2";

const Button = ({
  text,
  href,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
}: ButtonProps) => {
  const classes = `${base} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {text}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {text}
    </button>
  );
};

export default Button;