import { SchemaRegistryService } from '../schema-registry.service';
import { filesStorageSchemas } from './files-storage.schemas';
import { h5pEditorSchemas } from './h5p-editor.schemas';
import { schulconnexProvisioningSchemas } from './schulconnex-provisioning.schemas';

/**
 * Register all predefined schemas with the schema registry
 */
export function registerAllSchemas(schemaRegistry: SchemaRegistryService): void {
	// Register files storage schemas
	filesStorageSchemas.forEach((schema) => {
		schemaRegistry.registerSchema(schema);
	});

	// Register H5P editor schemas
	h5pEditorSchemas.forEach((schema) => {
		schemaRegistry.registerSchema(schema);
	});

	// Register Schulconnex provisioning schemas
	schulconnexProvisioningSchemas.forEach((schema) => {
		schemaRegistry.registerSchema(schema);
	});
}

/**
 * Get all predefined schemas
 */
export function getAllPredefinedSchemas() {
	return [...filesStorageSchemas, ...h5pEditorSchemas, ...schulconnexProvisioningSchemas];
}
