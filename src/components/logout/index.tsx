"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, LogOut } from "lucide-react";

type LogoutButtonProps = {
  handleLogout: () => void;
};

export const LogoutButton: React.FC<LogoutButtonProps> = ({ handleLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-1 rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-center inline-flex items-center justify-center gap-2"
        aria-haspopup="dialog"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* modal */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-lg border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-sm font-semibold text-slate-900">Confirm logout</h3>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="p-4">
              <p className="text-sm text-slate-700">
                Are you sure you want to sign out? You will be returned to the login page.
              </p>

              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>

                <Button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="bg-red-600 text-white px-4 py-2 hover:bg-red-700"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;