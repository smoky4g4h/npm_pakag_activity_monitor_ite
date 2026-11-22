import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { ActivityTracker } from '../index.js';
import { TrackerConfig, ActivityTrackerContextValue } from '../types/index.js';

const ActivityTrackerContext = createContext<ActivityTrackerContextValue | null>(null);

export const ActivityTrackerProvider: React.FC<{
  config: TrackerConfig;
  children: React.ReactNode;
}> = ({ config, children }) => {
  const tracker = useMemo(() => new ActivityTracker(config), [config]);

  useEffect(() => {
    tracker.init();
    return () => tracker.destroy();
  }, [tracker]);

  return (
    <ActivityTrackerContext.Provider value={{ tracker }}>
      {children}
    </ActivityTrackerContext.Provider>
  );
};

export const useActivityTracker = (): ActivityTracker => {
  const context = useContext(ActivityTrackerContext);
  if (!context) {
    throw new Error('useActivityTracker must be used within an ActivityTrackerProvider');
  }
  return context.tracker as ActivityTracker;
};
