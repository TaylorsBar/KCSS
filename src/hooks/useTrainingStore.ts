import { create } from 'zustand';

export type TrainingModuleId =
  | 'obd-basics'
  | 'dtc-diagnostics'
  | 'oem-insights'
  | 'predictive-maintenance'
  | 'advanced-performance';

interface TrainingState {
  completedModules: Set<TrainingModuleId>;
  completeModule: (id: TrainingModuleId) => void;
  isUnlocked: (featureModuleId: TrainingModuleId) => boolean;
  isModuleLocked: (moduleId: TrainingModuleId, allModules: { id: TrainingModuleId }[]) => boolean;
}

const TRAINING_STORAGE_KEY = 'cartelworx_training_progress';

const loadFromStorage = (): Set<TrainingModuleId> => {
  try {
    const item = localStorage.getItem(TRAINING_STORAGE_KEY);
    const completed = item
      ? new Set<TrainingModuleId>(JSON.parse(item) as TrainingModuleId[])
      : new Set<TrainingModuleId>();
    completed.add('obd-basics');
    return completed;
  } catch {
    return new Set(['obd-basics']);
  }
};

const saveToStorage = (completedModules: Set<TrainingModuleId>) => {
  localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(Array.from(completedModules)));
};

export const useTrainingStore = create<TrainingState>((set, get) => ({
  completedModules: loadFromStorage(),

  completeModule: (id) => {
    set((state) => {
      const newCompleted = new Set<TrainingModuleId>(state.completedModules).add(id);
      saveToStorage(newCompleted);
      return { completedModules: newCompleted };
    });
  },

  isUnlocked: (featureModuleId) => get().completedModules.has(featureModuleId),

  isModuleLocked: (moduleId, allModules) => {
    const moduleIndex = allModules.findIndex((m) => m.id === moduleId);
    if (moduleIndex <= 0) return false;
    const previousModuleId = allModules[moduleIndex - 1].id;
    return !get().completedModules.has(previousModuleId);
  },
}));
