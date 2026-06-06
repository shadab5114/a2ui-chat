const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('catalog.json', 'utf8'));

// Basic Catalog
const basicCatalog = {
  ...catalog,
  $id: "https://telcoconnect.example.com/a2ui/catalog-basic.json",
  title: "TelcoConnect Basic Catalog",
  description: "A catalog of custom Basic components.",
  catalogId: "basic-v1",
  components: {},
  $defs: { AnyComponent: { oneOf: [] } }
};

const basicComponents = ['Container', 'Text', 'Button', 'SelectionCard', 'Badge', 'Toggle', 'Divider', 'Icon', 'PerkCard'];
for (const name of basicComponents) {
  basicCatalog.components[name] = catalog.components[name];
  basicCatalog.$defs.AnyComponent.oneOf.push({ $ref: `#/components/${name}` });
}

fs.writeFileSync('catalogs/catalog-basic.json', JSON.stringify(basicCatalog, null, 2));

// MUI Catalog
const muiCatalog = {
  ...catalog,
  $id: "https://telcoconnect.example.com/a2ui/catalog-mui.json",
  title: "TelcoConnect MUI Catalog",
  description: "A catalog using only MUI components.",
  catalogId: "mui-v1",
  components: {},
  $defs: { AnyComponent: { oneOf: [] } }
};

// We will map the hybrid components to purely MUI ones.
const muiComponents = {
  MuiBox: {
    type: "object",
    properties: {
      component: { const: "MuiBox" },
      id: { type: "string" },
      children: { type: "array", items: { $ref: "#/$defs/AnyComponent" } },
      sx: { type: "object" }
    },
    required: ["component", "id", "children"]
  },
  MuiTypography: {
    type: "object",
    properties: {
      component: { const: "MuiTypography" },
      id: { type: "string" },
      text: { type: "string" },
      variant: { type: "string", enum: ["h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "caption", "button", "overline"], default: "body1" },
      color: { type: "string", enum: ["initial", "inherit", "primary", "secondary", "textPrimary", "textSecondary", "error"], default: "initial" },
      align: { type: "string", enum: ["inherit", "left", "center", "right", "justify"], default: "inherit" }
    },
    required: ["component", "id", "text"]
  },
  MuiButton: {
    type: "object",
    properties: {
      component: { const: "MuiButton" },
      id: { type: "string" },
      label: { type: "string" },
      variant: { type: "string", enum: ["text", "outlined", "contained"], default: "contained" },
      color: { type: "string", enum: ["inherit", "primary", "secondary", "success", "error", "info", "warning"], default: "primary" },
      size: { type: "string", enum: ["small", "medium", "large"], default: "medium" },
      action: {
        type: "object",
        properties: { type: { type: "string" }, payload: { type: "object" } },
        required: ["type"]
      }
    },
    required: ["component", "id", "label"]
  },
  MuiCard: catalog.components['MuiCard'],
  MuiChip: catalog.components['MuiChip'],
  MuiIcon: catalog.components['MuiIcon'],
  MuiSwitch: {
    type: "object",
    properties: {
      component: { const: "MuiSwitch" },
      id: { type: "string" },
      bindingKey: { type: "string" },
      color: { type: "string", enum: ["primary", "secondary", "default"], default: "primary" }
    },
    required: ["component", "id", "bindingKey"]
  },
  MuiDivider: {
    type: "object",
    properties: {
      component: { const: "MuiDivider" },
      id: { type: "string" },
      variant: { type: "string", enum: ["fullWidth", "inset", "middle"], default: "fullWidth" }
    },
    required: ["component", "id"]
  }
};

muiCatalog.components = muiComponents;
for (const name of Object.keys(muiComponents)) {
  muiCatalog.$defs.AnyComponent.oneOf.push({ $ref: `#/components/${name}` });
}

fs.writeFileSync('catalogs/catalog-mui.json', JSON.stringify(muiCatalog, null, 2));

console.log('Catalogs generated successfully.');
