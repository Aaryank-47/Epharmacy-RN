import { useFeatureFlags } from '../context/FeatureFlagsContext';

export const useFeature = (flagKey: string): boolean => {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(flagKey);
};

export default useFeature;
