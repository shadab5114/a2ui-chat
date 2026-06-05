import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates an A2UI v0.9 compliant catalog.json exposing Material-UI (MUI) components directly.
 * The schema ensures the AI only outputs valid MUI prop values.
 */
function generateCatalog() {
  const catalog = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://telcoconnect.example.com/a2ui/catalog-mui.json",
    title: "TelcoConnect A2UI Catalog (MUI)",
    description: "Catalog of Material-UI (MUI) components for TelcoConnect. The AI must use these exact component names and properties.",
    catalogId: "telcoconnect-mui-v1",
    components: {
      MuiBox: {
        type: "object",
        description: "The Box component serves as a wrapper component for most of the CSS utility needs. Used for layouts.",
        properties: {
          component: { const: "MuiBox" },
          id: { type: "string" },
          children: {
            type: "array",
            items: { $ref: "#/$defs/AnyComponent" }
          },
          display: { type: "string", enum: ["block", "inline-block", "flex", "grid", "none"], default: "flex" },
          flexDirection: { type: "string", enum: ["row", "row-reverse", "column", "column-reverse"], default: "column" },
          alignItems: { type: "string", enum: ["flex-start", "center", "flex-end", "stretch", "baseline"], default: "stretch" },
          justifyContent: { type: "string", enum: ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"], default: "flex-start" },
          flexWrap: { type: "string", enum: ["nowrap", "wrap", "wrap-reverse"], default: "nowrap" },
          gap: { type: "number", description: "Spacing between children in spacing units (usually 1 unit = 8px)" },
          p: { type: "number", description: "Padding on all sides in spacing units." },
          m: { type: "number", description: "Margin on all sides in spacing units." },
          sx: { type: "object", description: "The sx prop lets you style elements inline." }
        },
        required: ["component", "id", "children"]
      },
      
      MuiTypography: {
        type: "object",
        description: "Use typography to present your design and content as clearly and efficiently as possible.",
        properties: {
          component: { const: "MuiTypography" },
          id: { type: "string" },
          text: { type: "string" },
          variant: { 
            type: "string", 
            enum: ["h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "caption", "button", "overline"],
            default: "body1"
          },
          color: { 
            type: "string", 
            enum: ["initial", "inherit", "primary", "secondary", "textPrimary", "textSecondary", "error"],
            default: "initial"
          },
          align: { type: "string", enum: ["inherit", "left", "center", "right", "justify"], default: "inherit" },
          gutterBottom: { type: "boolean", default: false, description: "If true, the text will have a bottom margin." },
          sx: { type: "object" }
        },
        required: ["component", "id", "text"]
      },

      MuiButton: {
        type: "object",
        description: "Buttons allow users to take actions, and make choices, with a single tap.",
        properties: {
          component: { const: "MuiButton" },
          id: { type: "string" },
          label: { type: "string" },
          variant: { type: "string", enum: ["text", "outlined", "contained"], default: "contained" },
          color: { type: "string", enum: ["inherit", "primary", "secondary", "success", "error", "info", "warning"], default: "primary" },
          size: { type: "string", enum: ["small", "medium", "large"], default: "medium" },
          disabled: { type: "boolean", default: false },
          fullWidth: { type: "boolean", default: false },
          action: {
            type: "object",
            properties: {
              type: { type: "string" },
              payload: { type: "object" }
            },
            required: ["type"]
          },
          startIcon: { type: "string", description: "Name of the MUI icon to show before the label." },
          sx: { type: "object" }
        },
        required: ["component", "id", "label"]
      },

      MuiCard: {
        type: "object",
        description: "Cards contain content and actions about a single subject.",
        properties: {
          component: { const: "MuiCard" },
          id: { type: "string" },
          variant: { type: "string", enum: ["elevation", "outlined"], default: "elevation" },
          children: {
            type: "array",
            items: { $ref: "#/$defs/AnyComponent" }
          },
          sx: { type: "object" }
        },
        required: ["component", "id", "children"]
      },

      MuiCardContent: {
        type: "object",
        description: "The content part of a Card.",
        properties: {
          component: { const: "MuiCardContent" },
          id: { type: "string" },
          children: {
            type: "array",
            items: { $ref: "#/$defs/AnyComponent" }
          },
          sx: { type: "object" }
        },
        required: ["component", "id", "children"]
      },

      MuiCardActions: {
        type: "object",
        description: "The action part of a Card, typically containing Buttons.",
        properties: {
          component: { const: "MuiCardActions" },
          id: { type: "string" },
          children: {
            type: "array",
            items: { $ref: "#/$defs/AnyComponent" }
          },
          sx: { type: "object" }
        },
        required: ["component", "id", "children"]
      },

      MuiSwitch: {
        type: "object",
        description: "Switches toggle the state of a single setting on or off.",
        properties: {
          component: { const: "MuiSwitch" },
          id: { type: "string" },
          bindingKey: { type: "string", description: "Path in application state to bind this switch to." },
          color: { type: "string", enum: ["primary", "secondary", "error", "info", "success", "warning", "default"], default: "primary" },
          size: { type: "string", enum: ["small", "medium"], default: "medium" },
          disabled: { type: "boolean", default: false },
          sx: { type: "object" }
        },
        required: ["component", "id", "bindingKey"]
      },

      MuiChip: {
        type: "object",
        description: "Chips are compact elements that represent an input, attribute, or action.",
        properties: {
          component: { const: "MuiChip" },
          id: { type: "string" },
          label: { type: "string" },
          variant: { type: "string", enum: ["filled", "outlined"], default: "filled" },
          color: { type: "string", enum: ["default", "primary", "secondary", "error", "info", "success", "warning"], default: "default" },
          size: { type: "string", enum: ["small", "medium"], default: "medium" },
          sx: { type: "object" }
        },
        required: ["component", "id", "label"]
      },

      MuiDivider: {
        type: "object",
        description: "A divider is a thin line that groups content in lists and layouts.",
        properties: {
          component: { const: "MuiDivider" },
          id: { type: "string" },
          variant: { type: "string", enum: ["fullWidth", "inset", "middle"], default: "fullWidth" },
          orientation: { type: "string", enum: ["horizontal", "vertical"], default: "horizontal" },
          sx: { type: "object" }
        },
        required: ["component", "id"]
      },

      MuiIcon: {
        type: "object",
        description: "Material Design icons.",
        properties: {
          component: { const: "MuiIcon" },
          id: { type: "string" },
          name: { 
            type: "string", 
            enum: [
              "Check", "Close", "Star", "ArrowForward", "ArrowBack", "Info", "Warning", "Error",
              "Phone", "Settings", "Person", "ShoppingCart", "Wifi", "Speed", "Public", "PlayArrow",
              "MusicNote", "SportsEsports", "Tv", "Download", "Upload", "Lock", "Shield", "CardGiftcard",
              "AutoAwesome", "Bolt"
            ],
            description: "The name of the exported icon from @mui/icons-material (e.g., 'Check' for CheckIcon)"
          },
          color: { type: "string", enum: ["inherit", "action", "disabled", "primary", "secondary", "error", "info", "success", "warning"], default: "inherit" },
          fontSize: { type: "string", enum: ["inherit", "large", "medium", "small"], default: "medium" },
          sx: { type: "object" }
        },
        required: ["component", "id", "name"]
      }
    },
    $defs: {
      AnyComponent: {
        oneOf: [
          { $ref: "#/components/MuiBox" },
          { $ref: "#/components/MuiTypography" },
          { $ref: "#/components/MuiButton" },
          { $ref: "#/components/MuiCard" },
          { $ref: "#/components/MuiCardContent" },
          { $ref: "#/components/MuiCardActions" },
          { $ref: "#/components/MuiSwitch" },
          { $ref: "#/components/MuiChip" },
          { $ref: "#/components/MuiDivider" },
          { $ref: "#/components/MuiIcon" }
        ]
      }
    }
  };

  const outputPath = path.join(__dirname, '..', 'catalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`✅ Successfully generated MUI catalog at ${outputPath}`);
}

generateCatalog();
