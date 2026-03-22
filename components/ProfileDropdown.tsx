import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./Button";
import { ProfileIcon } from "./icons/Profile";
import SubscriptionModal from "./SubscriptionCard";

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const menuItems = [
    {
      label: "Connect AI Agent",
      href: "/connect",
      description: "Set up MCP for Claude, Cursor, VS Code"
    },
    {
      label: "Account Settings",
      href: "/settings",
      description: "Manage your account preferences"
    },
    {
      label: "Release Notes",
      href: "/release-notes",
      description: "See what's new"
    },
    {
      label: "Privacy Policy",
      href: "/privacy",
      description: "How we protect your data"
    },
    {
      label: "Terms of Service",
      href: "/terms",
      description: "Our terms and conditions"
    },
    {
      label: "Contact Us",
      href: "/contact",
      description: "Get in touch with us"
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="tertiary"
        className="!bg-transparent flex items-center gap-2 p-2 rounded-lg hover:bg-foreground-light transition duration-200"
      >
        <ProfileIcon size={32} />
        <span className="text-foreground text-sm font-medium">
          {session?.user?.name || "User"}
        </span>
        <svg
          className={`w-4 h-4 text-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background-light border border-primary/20 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <ProfileIcon size={40} />
              <div>
                <p className="text-foreground font-semibold">
                  {session?.user?.name || "User"}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <Button
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                variant="tertiary"
                className="!bg-transparent flex items-center px-4 py-3 hover:bg-foreground-light transition duration-200 w-full text-left"
              >
                <div className="flex-1">
                  <p className="text-foreground font-medium">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.description}</p>
                </div>
              </Button>
            ))}

            {/* Subscription Section */}
            <div className="px-4 py-3 border-t border-primary/10">
              <SubscriptionModal onSubscriptionChange={() => {}} />
            </div>

            {/* Sign Out Section */}
            <div className="px-4 py-3 border-t border-primary/10">
              <Button
                onClick={handleSignOut}
                variant="tertiary"
                className="!bg-transparent flex items-center w-full text-left hover:bg-red-500/10 transition duration-200 rounded px-4 py-3"
              >
                <div>
                  <p className="text-red-400 font-medium">Sign Out</p>
                  <p className="text-gray-400 text-xs">End your session</p>
                </div>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
