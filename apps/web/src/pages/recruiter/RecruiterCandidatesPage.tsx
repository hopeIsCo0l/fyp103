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
import { MOCK_PIPELINE } from '../../data/mockRecruit';

export default function RecruiterCandidatesPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        {t('recruit.pipeline.title')}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {t('recruit.pipeline.subtitle')}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('recruit.pipeline.colCandidate')}</TableCell>
              <TableCell>{t('recruit.pipeline.colRole')}</TableCell>
              <TableCell>{t('recruit.pipeline.colStage')}</TableCell>
              <TableCell align="right">{t('recruit.pipeline.colUpdated')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_PIPELINE.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.candidateName}</TableCell>
                <TableCell>{row.jobTitle}</TableCell>
                <TableCell>
                  <Chip size="small" label={t(`recruit.pipelineStage.${row.stage}`)} />
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
