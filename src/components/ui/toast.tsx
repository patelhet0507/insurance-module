import { ToastContainer, toast, type ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Toaster() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3500}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
    />
  );
}

export function notify(message: string, opts?: ToastOptions) {
  return toast(message, opts);
}

export function notifySuccess(message: string) {
  toast.success(message);
}
export function notifyError(message: string) {
  toast.error(message);
}
