import React from "react";

export const Home: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Your Feed</h1>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[200px] flex items-center justify-center">
        <p className="text-gray-500">This is where the user's social feed will appear.</p>
      </div>
    </div>
  );
};