import * as MuiIcons from '@mui/icons-material';

/**
 * A tiny wrapper to map A2UI "MuiIcon" component names (e.g. "Check", "PlayArrow")
 * to the actual dynamically imported MUI Icon components.
 */
export function IconRenderer({ name, ...props }) {
  // MUI exports icons matching the exact name from our catalog enum (e.g., "Check")
  // The fallback must also match the exact exported name ("HelpOutline", not "HelpOutlineIcon")
  const IconComponent = MuiIcons[name] || MuiIcons.HelpOutline;
  
  if (!IconComponent) return null; // Safety check
  
  return <IconComponent {...props} />;
}
