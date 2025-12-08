import ThemeToggle from '@/components/ThemeToggle';
import ProfileDropdown from "@/components/ProfileDropdown";

export default function WorkflowExecutionSkeleton() {
  return (
    <div>
      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[90vh]">
        {/* Navigation Skeleton */}
        <nav className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="h-4 w-20 bg-background-light animate-pulse rounded"></div>
            <div className="h-4 w-16 bg-background-light animate-pulse rounded"></div>
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </nav>

        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-8 w-48 bg-background-light animate-pulse rounded mb-2"></div>
            <div className="h-4 w-64 bg-background-light animate-pulse rounded"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-10 w-24 bg-secondary animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-primary animate-pulse rounded"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-background-light rounded-lg p-6">
          <div className="max-w-md w-full">
            {/* Form Header */}
            <div className="h-6 w-32 bg-background-extra-light animate-pulse rounded mb-4"></div>

            {/* Form Fields */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-24 bg-background-extra-light animate-pulse rounded mb-1"></div>
                  <div className="h-10 bg-background-extra-light animate-pulse rounded"></div>
                </div>
              ))}

              {/* Submit Button */}
              <div className="h-10 w-full bg-primary animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}