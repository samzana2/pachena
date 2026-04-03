"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from "react";
import { usePathname } from 'next/navigation';

const AdminSubdomainRedirect = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname;

    if (hostname === "admin.pachena.co") {
      if (!pathname.startsWith("/admin")) {
        router.push("/admin/auth");
      }
    } else if (hostname === "social.pachena.co") {
      if (!pathname.startsWith("/admin/social")) {
        router.push("/admin/social");
      }
    }
  }, [pathname, router]);

  return null;
};

export default AdminSubdomainRedirect;
