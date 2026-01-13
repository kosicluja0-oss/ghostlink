import { useState, useEffect, useCallback } from 'react';
import { Annotation, MilestoneColor, MilestoneSize } from '@/components/analytics/ChartAnnotation';
import { USE_MOCK_DATA, getMockAnnotations } from '@/lib/mockData';

const STORAGE_KEY = 'ghost-link-milestones';

export function useMilestones() {
  const [milestones, setMilestones] = useState<Annotation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMilestones(parsed);
      } else if (USE_MOCK_DATA) {
        // Initialize with mock data if no stored data exists
        const mockAnnotations = getMockAnnotations();
        setMilestones(mockAnnotations);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockAnnotations));
      }
    } catch (error) {
      console.error('Failed to load milestones from localStorage:', error);
      if (USE_MOCK_DATA) {
        setMilestones(getMockAnnotations());
      }
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage whenever milestones change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
      } catch (error) {
        console.error('Failed to save milestones to localStorage:', error);
      }
    }
  }, [milestones, isLoaded]);

  const addMilestone = useCallback((date: string, label: string, color: MilestoneColor = 'teal', size: MilestoneSize = 'medium') => {
    const trimmedLabel = label.trim().slice(0, 200); // Limit to 200 chars
    if (!trimmedLabel) return;

    const newMilestone: Annotation = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date,
      label: trimmedLabel,
      color,
      size,
      yOffset: 0, // Default to top
    };

    setMilestones(prev => [...prev, newMilestone]);
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMilestone = useCallback((id: string, label: string) => {
    const trimmedLabel = label.trim().slice(0, 200);
    if (!trimmedLabel) return;

    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, label: trimmedLabel } : m)
    );
  }, []);

  const updateMilestoneYOffset = useCallback((id: string, yOffset: number) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, yOffset: Math.max(0, Math.min(100, yOffset)) } : m)
    );
  }, []);

  const updateMilestoneColor = useCallback((id: string, color: MilestoneColor) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, color } : m)
    );
  }, []);

  const updateMilestoneSize = useCallback((id: string, size: MilestoneSize) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, size } : m)
    );
  }, []);

  const clearAllMilestones = useCallback(() => {
    setMilestones([]);
  }, []);

  return {
    milestones,
    addMilestone,
    deleteMilestone,
    updateMilestone,
    updateMilestoneYOffset,
    updateMilestoneColor,
    updateMilestoneSize,
    clearAllMilestones,
    isLoaded,
  };
}
