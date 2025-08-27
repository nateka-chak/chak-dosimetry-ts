"use client";

import { ReactNode } from "react";
import NotificationProvider from "@/components/Layout/NotificationProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}
