import ThemeToggle from "@/components/ThemeToggle";

export default function WorkflowEditSkeleton() {
  return (
    <div>
      {/* Header bar skeleton */}
      <div className="absolute top-0 left-0 right-0 bg-background-light border-b border-border z-20 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <div className="h-8 w-8 bg-background-extra-light animate-pulse rounded"></div>
          <div className="flex items-center gap-4">
            <div className="h-6 w-32 bg-background-extra-light animate-pulse rounded"></div>
            <div className="h-4 w-48 bg-background-extra-light animate-pulse rounded"></div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="h-4 w-24 bg-background-extra-light animate-pulse rounded"></div>
            <div className="h-4 w-16 bg-background-extra-light animate-pulse rounded"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-background-extra-light animate-pulse rounded-full"></div>
              <div className="h-4 w-16 bg-background-extra-light animate-pulse rounded"></div>
            </div>

            <div className="h-8 w-16 bg-primary animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      {/* Workflow Builder Skeleton */}
      <div className="pt-16 bg-background h-[calc(100vh-64px)] flex">
        {/* Left Sidebar - Node Palette Skeleton */}
        <div className="w-16 bg-background-light border-r border-border flex flex-col gap-2 p-2 z-10">
          <div className="relative">
            <div className="h-10 w-full bg-background-extra-light animate-pulse rounded"></div>
          </div>
          <div className="flex-1" />
          <div className="h-10 w-full bg-background-extra-light animate-pulse rounded"></div>
        </div>

        {/* Main Canvas Skeleton */}
        <div className="flex-1 relative">
          {/* Background dots pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          </div>

          {/* Mock ReactFlow nodes */}
          <div className="relative p-8">
            <div className="grid grid-cols-3 gap-8">
              {/* Entry node */}
              <div className="h-32 bg-background-light rounded-lg border border-border animate-pulse relative">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-3 bg-background-extra-light rounded"></div>
                    <div className="h-4 w-16 bg-background-extra-light rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-background-extra-light rounded w-3/4"></div>
                    <div className="h-3 bg-background-extra-light rounded w-1/2"></div>
                  </div>
                </div>
                {/* Connection handles */}
                <div className="absolute -right-2 top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
              </div>

              {/* AI node */}
              <div className="h-32 bg-background-light rounded-lg border border-border animate-pulse relative">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-4 bg-background-extra-light rounded"></div>
                    <div className="h-4 w-20 bg-background-extra-light rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-background-extra-light rounded w-2/3"></div>
                    <div className="h-3 bg-background-extra-light rounded w-1/3"></div>
                  </div>
                </div>
                <div className="absolute -left-2 top-1/4 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                <div className="absolute -right-2 top-3/4 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
              </div>

              {/* Scheduler node */}
              <div className="h-32 bg-background-light rounded-lg border border-border animate-pulse relative">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-4 bg-background-extra-light rounded"></div>
                    <div className="h-4 w-24 bg-background-extra-light rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 bg-background-extra-light rounded w-1/2"></div>
                  </div>
                </div>
                <div className="absolute -left-2 top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                <div className="absolute -right-2 top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
              </div>
            </div>

            {/* Mock connections */}
            <div className="mt-8 space-y-2">
              <div className="h-1 bg-primary/30 animate-pulse rounded w-1/4"></div>
              <div className="h-1 bg-primary/30 animate-pulse rounded w-1/3"></div>
              <div className="h-1 bg-primary/30 animate-pulse rounded w-1/5"></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel Skeleton */}
        <div className="w-80 bg-background-light border-l border-border">
          <div className="h-full overflow-clip relative w-80 overflow-y-auto">
            {/* Header */}
            <div className="border-border border-b-[0.5px] h-[49px] left-0 top-0 w-80 z-10">
              <div className="flex h-[49px] items-center justify-between overflow-clip px-[16px] relative w-80">
                <div className="flex gap-2 items-center">
                  <div className="w-4 h-3 bg-background-extra-light animate-pulse rounded"></div>
                  <div className="h-5 w-16 bg-background-extra-light animate-pulse rounded"></div>
                  <div className="h-4 w-12 bg-background-extra-light animate-pulse rounded"></div>
                </div>
                <div className="h-6 w-14 bg-error/20 animate-pulse rounded"></div>
              </div>
            </div>

            {/* Content */}
            <div className="mt-[20px] px-[20px] pb-[20px]">
              <div className="mb-[20px]">
                <div className="h-6 w-40 bg-background-extra-light animate-pulse rounded mb-2"></div>
                <div className="h-4 w-48 bg-background-extra-light animate-pulse rounded"></div>
              </div>

              <div className="mb-[20px]">
                <div className="h-4 w-24 bg-background-extra-light animate-pulse rounded mb-2"></div>
                <div className="h-8 w-full bg-background-extra-light animate-pulse rounded"></div>
              </div>

              <div className="mb-[12px]">
                <div className="h-5 w-16 bg-background-extra-light animate-pulse rounded mb-2"></div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 w-16 bg-background-extra-light animate-pulse rounded"></div>
                  <div className="h-4 w-12 bg-background-extra-light animate-pulse rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-background-extra-light animate-pulse rounded"></div>
                  <div className="h-8 bg-background-extra-light animate-pulse rounded"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-8 bg-background-extra-light animate-pulse rounded"></div>
                  <div className="h-8 bg-background-extra-light animate-pulse rounded"></div>
                </div>
              </div>

              <div className="h-10 w-full bg-background-extra-light animate-pulse rounded mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}