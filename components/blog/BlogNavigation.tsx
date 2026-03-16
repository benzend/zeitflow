import { Button } from '../Button';

interface BlogNavigationProps {
  currentPage?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
  previousHref?: string;
  nextHref?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}

export const BlogNavigation = ({
  currentPage = 1,
  totalPages = 1,
  hasPrevious = false,
  hasNext = false,
  previousHref,
  nextHref,
  onPrevious,
  onNext
}: BlogNavigationProps) => {
  return (
    <nav className="flex items-center justify-between mt-12 mb-8 animate-slide-up-fade">
      <div className="flex-1 flex justify-start">
        {hasPrevious && (onPrevious || previousHref) && (
          <Button
            onClick={onPrevious}
            href={previousHref}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous Page</span>
          </Button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      )}

      <div className="flex-1 flex justify-end">
        {hasNext && (onNext || nextHref) && (
          <Button
            onClick={onNext}
            href={nextHref}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <span>Next Page</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>
    </nav>
  );
};