import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
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
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-foreground-light transition duration-200 cursor-pointer"
        aria-label="Profile menu"
      >
        <ProfileIcon size={32} />
        <span className="text-primary text-sm font-medium">
          {session?.user?.name || session?.user?.email || "User"}
        </span>
        <svg
          className={`w-4 h-4 text-primary transition-transform duration-200 ${
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
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-foreground border border-primary/20 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <ProfileIcon size={40} />
              <div>
                <p className="text-primary font-semibold">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-gray-400 text-sm">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 hover:bg-foreground-light transition duration-200 cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-primary font-medium">{item.label}</p>
                  <p className="text-gray-400 text-xs">{item.description}</p>
                </div>
              </Link>
            ))}

            {/* Subscription Section */}
            <div className="px-4 py-3 border-t border-primary/10">
              <SubscriptionModal onSubscriptionChange={() => {}} />
            </div>

            {/* Sign Out Section */}
            <div className="px-4 py-3 border-t border-primary/10">
              <button
                onClick={handleSignOut}
                className="flex items-center w-full text-left hover:bg-red-500/10 transition duration-200 cursor-pointer rounded px-4 py-3"
              >
                <div>
                  <p className="text-red-400 font-medium">Sign Out</p>
                  <p className="text-gray-400 text-xs">End your session</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 