
import { useToast as useToastHook, toast as toastFunction } from "@/hooks/use-toast";

// Extend the toast function with convenience methods
interface ToastFunction {
  (props: Parameters<typeof toastFunction>[0]): ReturnType<typeof toastFunction>;
  success: (message: string) => void;
  error: (message: string) => void;
}

const toast = toastFunction as ToastFunction;

// Add success and error methods
toast.success = (message: string) => {
  toast({
    title: "Success",
    description: message,
  });
};

toast.error = (message: string) => {
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
};

export { useToastHook as useToast, toast };
