import { Command } from 'commander';
import { SchemaRegistryService } from './schema-registry.service';
import { registerAllSchemas } from './schemas/schema-definitions';

/**
 * CLI tool for managing RabbitMQ schemas
 * Usage: npm run schema-registry -- [command] [options]
 */

const program = new Command();
const schemaRegistry = new SchemaRegistryService();

// Register all predefined schemas
registerAllSchemas(schemaRegistry);

program.name('schema-registry').description('CLI tool for managing RabbitMQ message schemas').version('1.0.0');

// List all schemas
program
	.command('list')
	.description('List all registered schemas')
	.option('-e, --exchange <exchange>', 'Filter by exchange')
	.option('-v, --verbose', 'Show detailed information')
	.action((options) => {
		const allSchemas = schemaRegistry.getAllSchemas();
		const filteredSchemas = options.exchange
			? allSchemas.filter((schema) => schema.exchange === options.exchange)
			: allSchemas;

		if (filteredSchemas.length === 0) {
			console.log('No schemas found.');
			return;
		}

		console.log(`Found ${filteredSchemas.length} schemas:\n`);

		filteredSchemas.forEach((schema) => {
			if (options.verbose) {
				console.log(`ID: ${schema.id}`);
				console.log(`Exchange: ${schema.exchange}`);
				console.log(`Event: ${schema.event}`);
				console.log(`Version: ${schema.version}`);
				console.log(`Description: ${schema.description || 'N/A'}`);
				console.log(`Created: ${schema.createdAt.toISOString()}`);
				console.log(`Schema: ${JSON.stringify(schema.schema, null, 2)}`);
				console.log('---');
			} else {
				console.log(`${schema.exchange}:${schema.event}:${schema.version} - ${schema.description || 'No description'}`);
			}
		});
	});

// Get schema details
program
	.command('get')
	.description('Get schema details')
	.requiredOption('-e, --exchange <exchange>', 'Exchange name')
	.requiredOption('-v, --event <event>', 'Event name')
	.option('-s, --version <version>', 'Schema version', '1.0.0')
	.action((options) => {
		const schema = schemaRegistry.getSchema(options.exchange, options.event, options.version);

		if (!schema) {
			console.error(`Schema not found: ${options.exchange}:${options.event}:${options.version}`);
			process.exit(1);
		}

		console.log(JSON.stringify(schema, null, 2));
	});

// Validate a message
program
	.command('validate')
	.description('Validate a message against a schema')
	.requiredOption('-e, --exchange <exchange>', 'Exchange name')
	.requiredOption('-v, --event <event>', 'Event name')
	.requiredOption('-m, --message <message>', 'Message JSON string')
	.option('-s, --version <version>', 'Schema version', '1.0.0')
	.action((options) => {
		try {
			const message = JSON.parse(options.message);
			const result = schemaRegistry.validateMessage(options.exchange, options.event, options.version, message);

			if (result.isValid) {
				console.log('✅ Message is valid');
			} else {
				console.log('❌ Message validation failed:');
				result.errors.forEach((error, index) => {
					console.log(`  ${index + 1}. ${error.message}${error.field ? ` (field: ${error.field})` : ''}`);
				});
				process.exit(1);
			}
		} catch (error) {
			console.error('Error parsing message JSON:', error);
			process.exit(1);
		}
	});

// List schema versions
program
	.command('versions')
	.description('List all versions of a schema')
	.requiredOption('-e, --exchange <exchange>', 'Exchange name')
	.requiredOption('-v, --event <event>', 'Event name')
	.action((options) => {
		const versions = schemaRegistry.getSchemaVersions(options.exchange, options.event);

		if (versions.length === 0) {
			console.log(`No schemas found for ${options.exchange}:${options.event}`);
			return;
		}

		console.log(`Available versions for ${options.exchange}:${options.event}:`);
		versions.forEach((version) => console.log(`  - ${version}`));
	});

// Generate schema template
program
	.command('template')
	.description('Generate a schema template')
	.requiredOption('-e, --exchange <exchange>', 'Exchange name')
	.requiredOption('-v, --event <event>', 'Event name')
	.option('-s, --version <version>', 'Schema version', '1.0.0')
	.action((options) => {
		const template = {
			id: `${options.event}-v${options.version.split('.')[0]}`,
			version: options.version,
			exchange: options.exchange,
			event: options.event,
			schema: {
				type: 'object',
				properties: {
					// Define your message properties here
					id: { type: 'string' },
					// Add more fields as needed
				},
				required: ['id'],
				additionalProperties: false,
			},
			description: `Schema for ${options.exchange}:${options.event}`,
		};

		console.log('Schema template:');
		console.log(JSON.stringify(template, null, 2));
	});

// Show statistics
program
	.command('stats')
	.description('Show schema registry statistics')
	.action(() => {
		const allSchemas = schemaRegistry.getAllSchemas();
		const exchanges = new Set(allSchemas.map((s) => s.exchange));
		const events = new Set(allSchemas.map((s) => `${s.exchange}:${s.event}`));

		console.log('Schema Registry Statistics:');
		console.log(`  Total schemas: ${allSchemas.length}`);
		console.log(`  Exchanges: ${exchanges.size}`);
		console.log(`  Unique events: ${events.size}`);
		console.log(`  Exchanges: [${Array.from(exchanges).join(', ')}]`);
	});

program.parse();

export { program as schemaRegistryCli };
