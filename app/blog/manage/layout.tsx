import type { ReactNode } from "react";
import { blogAdminMetadata } from "@/lib/blog-admin-metadata";

export const metadata = blogAdminMetadata;

export default function BlogManageLayout({ children }: { children: ReactNode }) {
  return children;
}
