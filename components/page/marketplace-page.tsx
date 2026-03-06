import type { ReactNode } from "react";

type MarketplacePageProps = {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
};

type MarketplacePageContentProps = {
  children: ReactNode;
};

export function MarketplacePage({ title, subtitle, children }: MarketplacePageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 font-mono transition-colors">
      <div className="mb-10 border-b border-stone-200 pb-6 transition-colors dark:border-stone-800">
        <h1 className="text-3xl font-light tracking-tight text-stone-900 transition-colors dark:text-stone-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-stone-500 transition-colors dark:text-stone-400">
          {subtitle}
        </p>
      </div>

      <div className="transition-colors">
        {children}
      </div>
    </div>
  );
}

export function MarketplacePageContent({ children }: MarketplacePageContentProps) {
  return <div className="transition-colors">{children}</div>;
}