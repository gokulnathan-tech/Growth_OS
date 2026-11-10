import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import ShareIcon from "@mui/icons-material/Share"; // <-- 1. Share icon-a import pannikonga[cite: 2]
import { Share } from '@capacitor/share'; // <-- 2. Capacitor share plugin-a import pannikonga

export default function Header({ onDownload }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = (isLandscape) => {
    onDownload(isLandscape);
    handleClose();
  };

  // <-- 3. Share button click aana work aagura function[cite: 2]
  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Kani Tree Planner',
        text: 'Check out my tree plan details!',
        dialogTitle: 'Share via',
      });
    } catch (error) {
      console.log('Error sharing: ', error);
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: "#111827",
        borderBottom: "1px solid #334155",
      }}
    >
      <Toolbar>
        <IconButton 
          edge="start" 
          color="inherit" 
          onClick={() => navigate("/")}
          sx={{ mr: 1, color: "#94a3b8" }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography
          sx={{
            flexGrow: 1,
            fontWeight: "bold",
            color: "#4CAF50",
          }}
        >
          🌳 KaniTreePlanner
        </Typography>

        {/* <-- 4. Share Button-a Download button-ku pakkathula add pannirukku[cite: 2] */}
        <Button
          variant="outlined"
          color="success"
          startIcon={<ShareIcon />}
          onClick={handleShare}
          sx={{ mr: 1 }}
        >
          Share
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<DownloadIcon />}
          onClick={handleClick}
        >
          Download JPG
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{ sx: { background: "#1e293b", color: "white" } }}
        >
          <MenuItem onClick={() => handleDownload(false)}>📱 Portrait Mode</MenuItem>
          <MenuItem onClick={() => handleDownload(true)}>📟 Landscape Mode</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}