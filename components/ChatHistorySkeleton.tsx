export default function ChatHistorySkeleton() {
  return (
    <div className="space-y-4">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-primary bg-opacity-20 animate-pulse">
          <div className="h-4 w-32 bg-background-light rounded mb-2"></div>
          <div className="h-4 w-24 bg-background-light rounded"></div>
        </div>
      </div>
      
      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="w-full max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-surface animate-pulse">
          <div className="space-y-2">
            <div className="h-4 w-full bg-background-light rounded"></div>
            <div className="h-4 w-3/4 bg-background-light rounded"></div>
            <div className="h-4 w-5/6 bg-background-light rounded"></div>
          </div>
          <div className="h-3 w-16 bg-background-extra-light rounded mt-2"></div>
        </div>
      </div>
      
      {/* Second user message skeleton */}
      <div className="flex justify-end">
        <div className="w-full max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-primary bg-opacity-20 animate-pulse">
          <div className="h-4 w-40 bg-background-light rounded mb-2"></div>
          <div className="h-4 w-28 bg-background-light rounded"></div>
        </div>
      </div>
      
      {/* Second assistant message skeleton with workflow button */}
      <div className="flex justify-start">
        <div className="w-full max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-surface animate-pulse">
          <div className="space-y-2 mb-3">
            <div className="h-4 w-full bg-background-light rounded"></div>
            <div className="h-4 w-2/3 bg-background-light rounded"></div>
            <div className="h-4 w-4/5 bg-background-light rounded"></div>
            <div className="h-4 w-3/4 bg-background-light rounded"></div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="h-8 w-32 bg-primary bg-opacity-30 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
