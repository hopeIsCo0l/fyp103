import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <ToggleButtonGroup
      value={i18n.language?.startsWith('am') ? 'am' : 'en'}
      exclusive
      onChange={(_, lang) => lang && i18n.changeLanguage(lang)}
      size="small"
    >
      <ToggleButton value="en">EN</ToggleButton>
      <ToggleButton value="am">አማ</ToggleButton>
    </ToggleButtonGroup>
  );
}
