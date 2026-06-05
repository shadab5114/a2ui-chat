import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const CATALOGS_DIR = path.join(__dirname, '..', 'src', 'catalogs');
const OUTPUT_PATH = path.join(__dirname, '..', 'catalog.json');

/**
 * Reads a JSON file and parses it.
 */
function readJson(filename) {
  const filePath = path.join(CATALOGS_DIR, filename);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * The "Linking" process: merges modular catalogs into a single standalone A2UI catalog.
 */
function registerCatalogs() {
  console.log('🔄 Starting catalog linking process...');

  try {
    const basicCatalog = readJson('basic-catalog.json');
    const muiCatalog = readJson('mui-catalog.json');

    // 1. Create the base standalone structure
    const finalCatalog = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://telcoconnect.example.com/a2ui/catalog-hybrid.json",
      title: "TelcoConnect Hybrid Catalog",
      description: "A combined catalog of custom Basic components and specific MUI extensions.",
      catalogId: "telcoconnect-hybrid-v1",
      components: {},
      $defs: {
        AnyComponent: {
          oneOf: []
        }
      }
    };

    // 2. Merge components
    Object.assign(finalCatalog.components, basicCatalog.components);
    console.log(`✅ Loaded ${Object.keys(basicCatalog.components).length} components from Basic Catalog`);

    Object.assign(finalCatalog.components, muiCatalog.components);
    console.log(`✅ Loaded ${Object.keys(muiCatalog.components).length} components from MUI Catalog`);

    // 3. Rebuild the $defs.AnyComponent.oneOf array so the AI knows all available components
    const allComponentNames = Object.keys(finalCatalog.components);
    finalCatalog.$defs.AnyComponent.oneOf = allComponentNames.map(name => ({
      $ref: `#/components/${name}`
    }));

    // 4. Write to the final output destination
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalCatalog, null, 2), 'utf-8');
    
    console.log(`🚀 Successfully linked and generated standalone catalog.json with ${allComponentNames.length} total components.`);
    console.log(`📍 Output: ${OUTPUT_PATH}`);

  } catch (error) {
    console.error('❌ Failed to register catalogs:', error.message);
    process.exit(1);
  }
}

registerCatalogs();
