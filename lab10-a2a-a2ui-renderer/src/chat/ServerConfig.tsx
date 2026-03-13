// Server Configuration Component

import React from "react";

interface ServerConfigProps {
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  isConnected: boolean;
}

export function ServerConfig({
  serverUrl,
  onServerUrlChange,
  isConnected,
}: ServerConfigProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(serverUrl);

  React.useEffect(() => {
    setEditValue(serverUrl);
  }, [serverUrl]);

  const handleSave = () => {
    if (editValue.trim()) {
      onServerUrlChange(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    onServerUrlChange("http://localhost:8001");
    setEditValue("http://localhost:8001");
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <label htmlFor="server-url" className="text-sm font-medium text-gray-700">
          Server URL:
        </label>
        {isEditing ? (
          <input
            id="server-url"
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEditValue(serverUrl);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="http://localhost:8001"
            autoFocus
          />
        ) : (
          <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
            {serverUrl}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-1 text-xs ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {isConnected ? "Connected" : "Disconnected"}
        </div>

        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              disabled={!isValidUrl(editValue)}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditValue(serverUrl);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              title="Reset to default"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
