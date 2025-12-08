import ThemeToggle from '@/components/ThemeToggle';
import ProfileDropdown from "@/components/ProfileDropdown";

export default function ExecutionDetailsSkeleton() {
  return (
    <div>
      <main className="container mx-auto px-4 py-10 max-w-6xl min-h-[90vh]">
        {/* Navigation Skeleton */}
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <div className="h-4 w-16 bg-background-light animate-pulse rounded"></div>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <div className="h-4 w-20 bg-background-light animate-pulse rounded"></div>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <div className="h-4 w-24 bg-background-light animate-pulse rounded"></div>
            </li>
            <li>
              <span className="text-foreground-light">/</span>
            </li>
            <li>
              <div className="h-4 w-32 bg-primary/20 animate-pulse rounded"></div>
            </li>
          </ul>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </nav>

        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-start">
            <div>
              <div className="h-8 w-48 bg-background-light animate-pulse rounded mb-2"></div>
              <div className="h-4 w-64 bg-background-light animate-pulse rounded mb-4"></div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-background-light animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-background-light animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-background-light animate-pulse rounded"></div>
              </div>
            </div>
          </div>

          {/* Input Data Section Skeleton */}
          <div className="bg-background-light rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-24 bg-background-extra-light animate-pulse rounded"></div>
              <div className="h-8 w-16 bg-primary/10 animate-pulse rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-background-extra-light animate-pulse rounded"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-3/4"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-1/2"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-5/6"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-2/3"></div>
            </div>
          </div>

          {/* Output Data Section Skeleton */}
          <div className="bg-background-light rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-28 bg-background-extra-light animate-pulse rounded"></div>
              <div className="h-8 w-16 bg-primary/10 animate-pulse rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-background-extra-light animate-pulse rounded"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-4/5"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-3/5"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-5/6"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-1/3"></div>
              <div className="h-4 bg-background-extra-light animate-pulse rounded w-4/6"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="h-10 w-32 bg-primary animate-pulse rounded"></div>
        </div>
      </main>
    </div>
  );
}