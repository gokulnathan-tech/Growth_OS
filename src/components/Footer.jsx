import React from 'react';
import { Typography, Link, Box } from '@mui/material';

export default function Footer() {
  return (
    <Box sx={{ width: '100%', textAlign: 'center', p: 2, mt: 'auto', zIndex: 10 }}>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        KaniTreePlanner Powered by{' '}
        <Link 
          href="https://gokul-nathan.netlify.app/" 
          target="_blank" 
          rel="noopener noreferrer"
          sx={{ color: '#4CAF50', textDecoration: 'none', fontWeight: 'bold' }}
        >
          Gokulnathan
        </Link>
      </Typography>
    </Box>
  );
}