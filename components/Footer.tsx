import { Button } from "./Button";

export const Footer = () => (

  <footer className="bg-surface border-t border-border py-6 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex justify-center space-x-6">
          <Button
            href="/privacy"
            variant="tertiary"
            className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors text-sm"
          >
            Privacy Policy
          </Button>
          <Button
            href="/terms"
            variant="tertiary"
            className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors text-sm"
          >
            Terms of Service
          </Button>
          <Button
            href="/contact"
            variant="tertiary"
            className="!bg-transparent !p-0 text-text-muted hover:text-primary transition-colors text-sm"
          >
            Contact
          </Button>
        </div>
        <div className="text-text-muted text-xs">
          @madeunlinked
        </div>
      </div>
    </div>


    <div className="flex flex-col items-center gap-2 mt-4 text-sm text-text-muted animate-slide-up-fade delay-500">
      <span>
        Made with <span className="text-primary animate-pulse">♥</span>{' '}
        for prompt chain enthusiasts
      </span>
    </div>
  </footer>

)

