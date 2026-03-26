import { Box, Button, Paper, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Unauthorized
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You do not have permission to access this page.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Back to home
        </Button>
      </Paper>
    </Box>
  );
}
