import type { ReactNode } from "react";

type ButtonVariant = "primary" | "accent" | "soft";

interface ButtonProps {
  text: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  fullWidth?: boolean;
  /** "primary" = original navbar style (unchanged). "accent" / "soft" = hero CTA styles. */
  variant?: ButtonVariant;
  /** Optional trailing icon (rendered after the text) */
  icon?: ReactNode;
  /** Opens href in a new tab safely */
  external?: boolean;
}

const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f4fe6]/50 focus-visible:ring-offset-2";

const variants: Record<ButtonVariant, string> = {
  // Original navbar button — untouched
  primary:
    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 h-12 text-[17px] font-normal text-white " +
    "bg-[radial-gradient(120%_140%_at_0%_100%,#7b97ff_0%,rgba(123,151,255,0)_55%),linear-gradient(90deg,#4560f0_0%,#2f4fe6_100%)] " +
    "shadow-[0_6px_16px_rgba(47,79,230,0.28),inset_0_1px_0_rgba(255,255,255,0.25)] " +
    "transition-all duration-300 hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95 " +
    focus,

  // Hero primary: 12px/24px padding, 8px gap, 16px/26px IBM Plex Sans
  accent:
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 " +
    "font-['IBM_Plex_Sans',sans-serif] text-[16px] leading-[26px] font-normal not-italic text-white " +
    "bg-[linear-gradient(225deg,#2F55F0_50%,#5A7CFB_85.36%,#88C7FF_120.71%)] " +
    "shadow-[1px_0_4px_0_rgba(0,0,0,0.02),0_1px_4px_0_rgba(0,0,0,0.02)] " +
    "transition-all duration-300 hover:brightness-110 hover:-translate-y-px active:translate-y-0 active:brightness-95 " +
    focus,

  // Hero secondary (resume)
  soft:
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 " +
    "font-['IBM_Plex_Sans',sans-serif] text-[16px] leading-[26px] font-normal not-italic text-[#131A28] " +
    "bg-[#E9ECF2] " +
    "shadow-[1px_0_2px_0_rgba(0,0,0,0.02),0_2px_2px_0_rgba(15,23,42,0.02)] " +
    "transition-all duration-300 hover:bg-[#E1E5EC] hover:-translate-y-px active:translate-y-0 " +
    focus,
};

const Button = ({
  text,
  href,
  onClick,
  type = "button",
  className = "",
  fullWidth = false,
  variant = "primary",
  icon,
  external = false,
}: ButtonProps) => {
  const classes = `${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`;

  const content = (
    <>
      {text}
      {icon}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {content}
    </button>
  );
};

export default Button;