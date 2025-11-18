import { Injectable, Logger } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export interface MessageSchema<T = unknown> {
	id: string;
	version: string;
	exchange: string;
	event: string;
	schema: Record<string, any>; // More flexible schema type
	description?: string;
	createdAt: Date;
}

export interface SchemaValidationError {
	message: string;
	field?: string;
	value?: unknown;
}

export interface ValidationResult {
	isValid: boolean;
	errors: SchemaValidationError[];
}

@Injectable()
export class SchemaRegistryService {
	private readonly logger = new Logger(SchemaRegistryService.name);
	private readonly ajv: Ajv;
	private readonly schemas = new Map<string, MessageSchema>();
	private readonly validators = new Map<string, ValidateFunction>();

	constructor() {
		this.ajv = new Ajv({ allErrors: true, strict: false });
		addFormats(this.ajv);
	}

	/**
	 * Register a new message schema in the registry
	 */
	public registerSchema<T>(schema: Omit<MessageSchema<T>, 'createdAt'>): void {
		const schemaId = this.generateSchemaId(schema.exchange, schema.event, schema.version);
		const fullSchema: MessageSchema<T> = {
			...schema,
			createdAt: new Date(),
		};

		try {
			const validator = this.ajv.compile(schema.schema);
			this.schemas.set(schemaId, fullSchema as MessageSchema);
			this.validators.set(schemaId, validator);

			this.logger.log(`Schema registered: ${schemaId}`);
		} catch (error) {
			this.logger.error(`Failed to register schema ${schemaId}`, error);
			throw new Error(`Invalid schema definition for ${schemaId}: ${error}`);
		}
	}

	/**
	 * Validate a message against its registered schema
	 */
	public validateMessage(exchange: string, event: string, version: string, message: unknown): ValidationResult {
		const schemaId = this.generateSchemaId(exchange, event, version);
		const validator = this.validators.get(schemaId);

		if (!validator) {
			this.logger.warn(`No schema found for ${schemaId}`);
			return {
				isValid: false,
				errors: [{ message: `No schema registered for ${schemaId}` }],
			};
		}

		const isValid = validator(message);
		const errors: SchemaValidationError[] = [];

		if (!isValid && validator.errors) {
			for (const error of validator.errors) {
				errors.push({
					message: error.message || 'Validation error',
					field: error.instancePath || error.schemaPath,
					value: error.data,
				});
			}
		}

		return { isValid, errors };
	}

	/**
	 * Get all available schemas for an exchange and event
	 */
	public getSchemaVersions(exchange: string, event: string): string[] {
		const versions: string[] = [];
		for (const [schemaId, schema] of this.schemas) {
			if (schema.exchange === exchange && schema.event === event) {
				versions.push(schema.version);
			}
		}
		return versions.sort();
	}

	/**
	 * Get schema by ID
	 */
	public getSchema(exchange: string, event: string, version: string): MessageSchema | undefined {
		const schemaId = this.generateSchemaId(exchange, event, version);
		return this.schemas.get(schemaId);
	}

	/**
	 * Get all registered schemas
	 */
	public getAllSchemas(): MessageSchema[] {
		return Array.from(this.schemas.values());
	}

	/**
	 * Check if a schema exists
	 */
	public hasSchema(exchange: string, event: string, version: string): boolean {
		const schemaId = this.generateSchemaId(exchange, event, version);
		return this.schemas.has(schemaId);
	}

	/**
	 * Remove a schema from the registry
	 */
	public removeSchema(exchange: string, event: string, version: string): boolean {
		const schemaId = this.generateSchemaId(exchange, event, version);
		const removed = this.schemas.delete(schemaId) && this.validators.delete(schemaId);
		if (removed) {
			this.logger.log(`Schema removed: ${schemaId}`);
		}
		return removed;
	}

	private generateSchemaId(exchange: string, event: string, version: string): string {
		return `${exchange}:${event}:${version}`;
	}
}
