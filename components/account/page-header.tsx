import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AccountPageHeaderProps {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}

export function AccountPageHeader({
  icon: Icon,
  title,
  description,
  action,
  backHref,
  backLabel,
  children,
}: AccountPageHeaderProps) {
  return (
    <div className="mb-8 border-b-2 border-sage-200 pb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          {backLabel}
        </Link>
      )}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-sage-600" strokeWidth={1.5} />}
          <h1 className="text-2xl font-light tracking-tight text-stone-900 font-mono">
            {title}
          </h1>
        </div>
        {action}
      </div>
      {description && <p className="text-sm text-stone-500">{description}</p>}
      {children}
    </div>
  );
}
