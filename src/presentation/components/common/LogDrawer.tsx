import React, { useState, useEffect, useRef } from "react";
import MotionCustomDrawer from "./CustomDrawer";
import CustomButton from "./CustomButton";
import {
  Copy,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Bug,
} from "lucide-react";
import { logger, LogEntry } from "../../../shared/utils/logger";

interface LogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogDrawer: React.FC<LogDrawerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<
    "all" | "info" | "warn" | "error" | "debug"
  >("all");
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load logs khi component mount
    logger.loadLogs().then(() => {
      setLogs(logger.getLogs());
    });

    // Subscribe to log updates
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  // Auto scroll to bottom when new logs added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(
    (log) => filter === "all" || log.level === filter
  );

  const handleCopyLogs = () => {
    const logText = filteredLogs
      .map((log) => {
        const date = new Date(log.timestamp);
        const time = date.toLocaleTimeString();
        const dataStr = log.data
          ? `\n${JSON.stringify(log.data, null, 2)}`
          : "";
        return `[${time}] [${log.level.toUpperCase()}] ${
          log.message
        }${dataStr}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(logText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warn":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "debug":
        return <Bug className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "error":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
      case "warn":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20";
      case "debug":
        return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20";
    }
  };

  return (
    <MotionCustomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="System Logs"
      subtitle={`${filteredLogs.length} log entries`}
      size="lg"
      direction="right"
      headerActions={
        <div className="flex items-center gap-2">
          <CustomButton
            variant="ghost"
            size="sm"
            icon={copied ? CheckCircle : Copy}
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
          >
            {copied ? "Copied!" : "Copy"}
          </CustomButton>
          <CustomButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleClearLogs}
            disabled={logs.length === 0}
          >
            Clear
          </CustomButton>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Filter Tabs */}
        <div className="flex-shrink-0 border-b border-border-default bg-card-background px-4 py-3">
          <div className="flex items-center gap-2">
            {["all", "info", "warn", "error", "debug"].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === level
                    ? "bg-button-bg text-button-bgText"
                    : "text-text-secondary hover:bg-sidebar-itemHover"
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
                <span className="ml-1.5 text-xs">
                  (
                  {level === "all"
                    ? logs.length
                    : logs.filter((l) => l.level === level).length}
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Log List */}
        <div
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-background"
          style={{ minHeight: 0 }}
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-text-secondary">No logs to display</p>
              <p className="text-sm text-text-tertiary mt-1">
                {filter === "all"
                  ? "No logs available"
                  : `No ${filter} logs found`}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const date = new Date(log.timestamp);
              const time = date.toLocaleTimeString();

              return (
                <div
                  key={log.id}
                  className={`rounded-lg border p-3 ${getLogColor(
                    log.level
                  )} border-current/20`}
                >
                  <div className="flex items-start gap-2">
                    {getLogIcon(log.level)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-current opacity-70">
                          {time}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {log.level}
                        </span>
                      </div>
                      <p className="text-sm font-medium break-words">
                        {log.message}
                      </p>
                      {log.data && (
                        <pre className="mt-2 text-xs bg-black/5 dark:bg-white/5 rounded p-2 overflow-x-auto">
                          <code>{JSON.stringify(log.data, null, 2)}</code>
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MotionCustomDrawer>
  );
};

export default LogDrawer;
