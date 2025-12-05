import type { NavigateOptions } from "react-router-dom";

import { HeroUIProvider } from "@heroui/system";
import { useHref, useNavigate } from "react-router-dom";
import { ToastProvider } from "@heroui/toast";
import NiceModal from "@ebay/nice-modal-react";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './config/queryClient';
import "@/components/modals";

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function Provider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider navigate={navigate} useHref={useHref} >
        <ToastProvider placement="top-center" toastOffset={20} />
        <NiceModal.Provider>{children}</NiceModal.Provider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}