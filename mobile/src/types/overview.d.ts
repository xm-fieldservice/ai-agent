declare module '../../../../overview/src' {
  export interface Feature {
    id: string;
    name: string;
    type: string;
    icon?: string;
    description?: string;
    order?: number;
    disabled?: boolean;
    visible?: boolean;
  }

  export const enum FeatureType {
    CHAT = 'chat',
    NOTE = 'note',
    LLM = 'llm',
    SETTINGS = 'settings'
  }

  export const FeatureEvents: {
    FEATURES_CHANGED: string;
    FEATURE_SELECTED: string;
    FEATURE_ACTION: string;
  };

  export interface FeaturesApi {
    registerFeature(feature: Feature): boolean;
    registerFeatures(features: Feature[]): void;
    updateFeature(id: string, updates: Partial<Feature>): boolean;
    unregisterFeature(id: string): boolean;
    setFeatureVisibility(id: string, visible: boolean): boolean;
    setFeatureDisabled(id: string, disabled: boolean): boolean;
    getAllFeatures(): Feature[];
    getFeaturesByType(type: FeatureType): Feature[];
    getVisibleFeatures(): Feature[];
    getFeature(id: string): Feature | undefined;
    selectFeature(id: string): void;
    performFeatureAction(id: string, action: string, payload?: any): void;
    onFeaturesChanged(callback: (features: Feature[]) => void): () => void;
    onFeatureSelected(callback: (feature: Feature) => void): () => void;
    onFeatureAction(callback: (data: { feature: Feature; action: string; payload?: any }) => void): () => void;
  }

  export interface EventBus {
    publish(topic: string, data: any): void;
    subscribe(topic: string, handler: (data: any) => void): () => void;
  }

  export const featuresApi: FeaturesApi;
  export const eventBus: EventBus;
} 