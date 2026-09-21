import { useSettings } from '../contexts/SettingsContext';

export const useTranslation = () => {
  const { t, currentLanguage, translations } = useSettings();
  
  return {
    t,
    language: currentLanguage,
    translations,
    isRTL: currentLanguage === 'ar' || currentLanguage === 'he',
  };
};

export default useTranslation;