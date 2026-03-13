// Loading Screen Component

import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Processing..." }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] animate-fade-in">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}
