import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  InputAdornment,
  Typography
} from "@mui/material";

// MUI Icons
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";

export default function NodeModal({ open, onClose, onSave, member }) {
  const [formData, setFormData] = useState({
    name: "",
    nominee: "",
    idNumber: "",
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        nominee: member.nominee || "",
        idNumber: member.idNumber || "",
      });
    }
  }, [member, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Strict 10-digit number validation for ID Number
    if (name === "idNumber") {
      // Remove any characters that are not numbers (0-9)
      const numericValue = value.replace(/[^0-9]/g, "");
      
      // Stop typing if length exceeds 10
      if (numericValue.length > 10) return; 

      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = () => {
    onSave({
      ...member,
      ...formData,
    });
  };

  // Check if there is an error (ID is typed but not exactly 10 digits)
  const isIdError = formData.idNumber.length > 0 && formData.idNumber.length !== 10;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth 
      PaperProps={{ 
        sx: { borderRadius: 3, padding: 1, backgroundColor: "#ffffff" } 
      }}
    >
      <DialogTitle sx={{ fontWeight: "bold", color: "#1e293b", pb: 1 }}>
        ✏️ Edit Member Details
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
          Update the member information below.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField
            label="Member Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="Nominee Name"
            name="nominee"
            value={formData.nominee}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <GroupIcon sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            label="ID Number"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleChange}
            fullWidth
            variant="outlined"
            error={isIdError}
            helperText={isIdError ? "ID Number must be exactly 10 digits" : ""}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BadgeIcon sx={{ color: isIdError ? "#d32f2f" : "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ fontWeight: "bold", color: "#64748b" }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary" 
          disableElevation
          disabled={isIdError} // Disable save button if ID is invalid
          sx={{ fontWeight: "bold", borderRadius: 2, px: 3 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}