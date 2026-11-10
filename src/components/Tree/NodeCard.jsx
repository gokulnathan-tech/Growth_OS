import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
} from "@mui/material";

import {
  Handle,
  Position,
} from "@xyflow/react";

import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import BadgeIcon from "@mui/icons-material/Badge";

const isMobile = window.innerWidth <= 768;

function getCardColor(level, completed) {
  switch (level) {
    case 1:
      return completed ? "#1976D2" : "#BBDEFB";

    case 2:
    case 3:
      return completed ? "#2E7D32" : "#C8E6C9";

    case 4:
      return completed ? "#AD1457" : "#F8BBD0";

    default:
      return "#ECEFF1";
  }
}

function NodeCard({ data }) {
  const member = data.member;

  const completed = member.name.trim() !== "";

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
      />

      <Card
        className="nodrag nopan"
        sx={{
          width: isMobile ? 170 : 280,
          minHeight: isMobile ? 110 : 170,
          borderRadius: isMobile ? 2 : 3,
          background: getCardColor(member.level, completed),
          border: "1px solid #E5E7EB",
          boxShadow: isMobile ? 2 : 4,
        }}
      >
        <CardContent
          sx={{
            p: isMobile ? 1 : 2,
            "&:last-child": {
              pb: isMobile ? 1 : 2,
            },
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: isMobile ? 14 : 22,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PersonIcon
              sx={{
                fontSize: isMobile ? 16 : 24,
              }}
            />

            {member.name || "Empty Member"}
          </Typography>

          <Typography
            sx={{
              mt: isMobile ? 0.8 : 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: isMobile ? 11 : 16,
            }}
          >
            <GroupIcon
              sx={{
                fontSize: isMobile ? 14 : 20,
              }}
            />

            {member.nominee || "-"}
          </Typography>

          <Typography
            sx={{
              mt: isMobile ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              fontSize: isMobile ? 11 : 16,
            }}
          >
            <BadgeIcon
              sx={{
                fontSize: isMobile ? 14 : 20,
              }}
            />

            {member.idNumber || "Not Created"}
          </Typography>
        </CardContent>

        <CardActions
          sx={{
            justifyContent: "center",
            p: isMobile ? 0.5 : 1,
          }}
        >
          <IconButton
            className="nodrag nopan"
            color="primary"
            size={isMobile ? "small" : "medium"}
            onClick={(e) => {
              e.stopPropagation();

              if (data.onEdit) {
                data.onEdit(member.id);
              }
            }}
          >
            <EditIcon
              sx={{
                fontSize: isMobile ? 18 : 24,
              }}
            />
          </IconButton>
        </CardActions>
      </Card>

      <Handle
        type="source"
        position={Position.Bottom}
      />
    </>
  );
}

export default NodeCard;