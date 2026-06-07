const fs = require('fs');
const path = require('path');

const clientModules = path.resolve(__dirname, '../../client/node_modules');
const muiBasePath = path.join(clientModules, '@mui/material');

let mui;
try {
  mui = require(muiBasePath);
} catch (err) {
  console.error(`Error loading @mui/material from ${muiBasePath}.`, err);
  process.exit(1);
}

const muiComponents = Object.keys(mui).filter(key => {
  return /^[A-Z]/.test(key) && 
         typeof mui[key] !== 'string' &&
         !key.endsWith('Context') &&
         key !== 'GlobalStyles' &&
         key !== 'StyledEngineProvider';
});

const components = {};

const enumRegex = /([a-zA-Z0-9_]+)\??:\s*(?:OverridableStringUnion<)?\s*((?:'[^']+'(?:\s*\|\s*)?)+)/g;
const primRegex = /([a-zA-Z0-9_]+)\??:\s*(boolean|string|number)\s*(?:\|[^;]+)?;/g;
const childrenRegex = /children\??:/;

muiComponents.forEach(compName => {
  const muiPrefixedName = `Mui${compName}`;
  let propsSchema = {
    component: { const: muiPrefixedName },
    sx: { type: "object" }
  };

  let dtsPath = path.join(muiBasePath, compName, `${compName}.d.ts`);
  if (!fs.existsSync(dtsPath)) {
    dtsPath = path.join(muiBasePath, compName, `index.d.ts`);
  }

  if (fs.existsSync(dtsPath)) {
    const content = fs.readFileSync(dtsPath, 'utf-8');

    let match;
    while ((match = enumRegex.exec(content)) !== null) {
      const propName = match[1];
      const values = match[2].split('|').map(s => s.trim().replace(/'/g, '')).filter(Boolean);
      if (values.length > 0) {
        propsSchema[propName] = { type: "string", enum: values };
      }
    }

    while ((match = primRegex.exec(content)) !== null) {
      const propName = match[1];
      const typeStr = match[2];
      if (!propsSchema[propName]) {
        propsSchema[propName] = { type: typeStr === 'boolean' ? 'boolean' : typeStr === 'number' ? 'number' : 'string' };
      }
    }

    if (childrenRegex.test(content)) {
      propsSchema.children = { 
        type: "array", 
        items: { "$ref": "https://a2ui.org/specification/v0_9/common_types.json#/$defs/AnyComponent" } 
      };
    }
  } else {
    propsSchema.children = { 
        type: "array", 
        items: { "$ref": "https://a2ui.org/specification/v0_9/common_types.json#/$defs/AnyComponent" } 
    };
  }

  components[muiPrefixedName] = {
    type: "object",
    allOf: [
      { "$ref": "https://a2ui.org/specification/v0_9/common_types.json#/$defs/ComponentCommon" },
      { "$ref": "#/$defs/CatalogComponentCommon" },
      {
        type: "object",
        properties: propsSchema,
        required: ["component"]
      }
    ]
  };
});

const catalog = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://telcoconnect.example.com/a2ui/catalog-mui.json",
  title: "TelcoConnect MUI Catalog",
  description: "A dynamically generated catalog of MUI components.",
  catalogId: "mui-v1",
  "$defs": {
    CatalogComponentCommon: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Optional unique identifier for the component."
        }
      }
    }
  },
  components: components
};

const outputPath = path.resolve(__dirname, '../catalogs/catalog-mui.json');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

console.log(`Successfully generated mui-catalog.json with ${muiComponents.length} components and extracted props at ${outputPath}`);
