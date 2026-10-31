import type { Metadata } from "next";

/** Blog create, manage, edit, and preview are not public documents. */
export const blogAdminMetadata: Metadata = {
  robots: { index: false },
};
