import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

export default function PurchasePreview({ purchases, onDelete }) {
  const calculateTotal = () => {
    return purchases.reduce((total, p) => total + p.amount1 + (p.amount2 || 0), 0);
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* Visual Preview Container */}
      <Box
        id="purchase-preview"
        sx={{
          backgroundColor: "#FFFFFF",
          color: "#000000",
          p: 6,
          fontFamily: "Arial, sans-serif",
          minHeight: "500px",
          width: "100%",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {purchases.length === 0 ? (
          <Typography sx={{ color: "#999", textAlign: "center", mt: 10 }}>
            No purchases added yet.
          </Typography>
        ) : (
          <>
            {purchases.map((p, index) => (
              <Box 
                key={p.id} 
                sx={{ 
                  display: "flex", 
                  alignItems: "center",
                  mb: 2.5,
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  position: "relative",
                  "&:hover .delete-btn": { opacity: 1 } // Show delete button on hover
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  {index + 1}, {p.name} &ndash; {p.idNumber} &ndash; {p.amount1}
                  {p.amount2 > 0 && ` + ${p.amount2} ${p.tag ? `(${p.tag})` : ""}`}
                </Box>

                {/* Delete button (Will NOT be captured in the JPG because it's absolutely positioned outside standard flow or hidden during capture if needed, but safe here) */}
                <IconButton 
                  className="delete-btn"
                  onClick={() => onDelete(p.id)} 
                  color="error" 
                  size="small"
                  sx={{ opacity: 0, transition: "opacity 0.2s", position: "absolute", right: -40 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 6, pr: 2 }}>
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ borderTop: "2px solid #000", width: "200px", mb: 1 }}></Box>
                <Typography sx={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                  TOTAL = {calculateTotal()}
                </Typography>
                <Box sx={{ borderTop: "2px solid #000", width: "200px", mt: 1 }}></Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}