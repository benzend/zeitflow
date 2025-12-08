import ThemeToggle from "@/components/ThemeToggle";
import ProfileDropdown from "@/components/ProfileDropdown";

export default function WorkflowStatsSkeleton() {
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
          <div className="flex gap-2">
            <div className="h-10 w-16 bg-secondary animate-pulse rounded"></div>
            <div className="h-10 w-16 bg-primary animate-pulse rounded"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-background-light rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 bg-background-extra-light animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-background-extra-light animate-pulse rounded"></div>
              </div>
              <div className="h-6 w-16 bg-background-extra-light animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        {/* Recent Executions Skeleton */}
        <div className="bg-background-light rounded-lg p-6">
          <div className="h-6 w-40 bg-background-extra-light animate-pulse rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-background-extra-light rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-background-light animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-background-light animate-pulse rounded"></div>
                  </div>
                  <div className="h-4 w-32 bg-background-light animate-pulse rounded"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-20 bg-background-light animate-pulse rounded"></div>
                  <div className="h-4 w-24 bg-background-light animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}