export const Footer = () => (

  <footer className="bg-[#18181b] border-t border-[#27272a] py-6 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex justify-center space-x-6">
          <a
            href="/privacy"
            className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors text-sm"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-[#d4d4d8] hover:text-[#a3e635] transition-colors text-sm"
          >
            Terms of Service
          </a>
        </div>
        <div className="text-[#71717a] text-xs">
          @madeunlinked
        </div>
      </div>
    </div>


    <div className="flex flex-col items-center gap-2 mt-4 text-sm text-[#71717a] animate-slide-up-fade delay-500">
      <span>
        Made with <span className="text-[#a3e635] animate-pulse">♥</span>{' '}
        for prompt chain enthusiasts
      </span>
    </div>
  </footer>

)

