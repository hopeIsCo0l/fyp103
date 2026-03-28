import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MOCK_APPLICATIONS } from '../../data/mockRecruit';

export default function CandidateApplicationsPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.applications.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.applications.subtitle')}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('recruit.applications.colRole')}</TableCell>
              <TableCell>{t('recruit.applications.colCompany')}</TableCell>
              <TableCell>{t('recruit.applications.colStage')}</TableCell>
              <TableCell align="right">{t('recruit.applications.colUpdated')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_APPLICATIONS.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.jobTitle}</TableCell>
                <TableCell>{row.company}</TableCell>
                <TableCell>
                  <Chip size="small" label={t(`recruit.stage.${row.stage}`)} />
                </TableCell>
                <TableCell align="right">{row.updatedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        {t('recruit.mockNotice')}
      </Typography>
    </Box>
  );
}
