import { Test, TestingModule } from '@nestjs/testing';
import { MessageSchema, SchemaRegistryService } from './schema-registry.service';

describe('SchemaRegistryService', () => {
	let service: SchemaRegistryService;

	interface TestMessage {
		id: string;
		name: string;
		count: number;
		tags?: string[];
	}

	const testSchema = {
		type: 'object',
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			count: { type: 'number', minimum: 0 },
			tags: {
				type: 'array',
				items: { type: 'string' },
				nullable: true,
			},
		},
		required: ['id', 'name', 'count'],
		additionalProperties: false,
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [SchemaRegistryService],
		}).compile();

		service = module.get<SchemaRegistryService>(SchemaRegistryService);
	});

	afterEach(() => {
		// Clear all schemas after each test
		const allSchemas = service.getAllSchemas();
		allSchemas.forEach((schema) => {
			service.removeSchema(schema.exchange, schema.event, schema.version);
		});
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('registerSchema', () => {
		it('should register a valid schema', () => {
			const schemaDefinition: Omit<MessageSchema<TestMessage>, 'createdAt'> = {
				id: 'test-message-v1',
				version: '1.0.0',
				exchange: 'test-exchange',
				event: 'test-event',
				schema: testSchema,
				description: 'Test message schema',
			};

			expect(() => service.registerSchema(schemaDefinition)).not.toThrow();
			expect(service.hasSchema('test-exchange', 'test-event', '1.0.0')).toBe(true);
		});

		it('should throw error for invalid schema', () => {
			const invalidSchema = {
				id: 'invalid-schema',
				version: '1.0.0',
				exchange: 'test-exchange',
				event: 'test-event',
				schema: { type: 'invalid-type' } as any,
			};

			expect(() => service.registerSchema(invalidSchema)).toThrow();
		});
	});

	describe('validateMessage', () => {
		beforeEach(() => {
			const schemaDefinition: Omit<MessageSchema<TestMessage>, 'createdAt'> = {
				id: 'test-message-v1',
				version: '1.0.0',
				exchange: 'test-exchange',
				event: 'test-event',
				schema: testSchema,
			};
			service.registerSchema(schemaDefinition);
		});

		it('should validate a correct message', () => {
			const validMessage: TestMessage = {
				id: 'test-id',
				name: 'Test Name',
				count: 42,
				tags: ['tag1', 'tag2'],
			};

			const result = service.validateMessage('test-exchange', 'test-event', '1.0.0', validMessage);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject an invalid message', () => {
			const invalidMessage = {
				id: 'test-id',
				name: 'Test Name',
				// missing required 'count' field
				tags: ['tag1', 'tag2'],
			};

			const result = service.validateMessage('test-exchange', 'test-event', '1.0.0', invalidMessage);

			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].message).toContain('count');
		});

		it('should return error for non-existent schema', () => {
			const message = { id: 'test', name: 'test', count: 1 };

			const result = service.validateMessage('non-existent', 'event', '1.0.0', message);

			expect(result.isValid).toBe(false);
			expect(result.errors[0].message).toContain('No schema registered');
		});
	});

	describe('schema management', () => {
		beforeEach(() => {
			const schemaDefinition: Omit<MessageSchema<TestMessage>, 'createdAt'> = {
				id: 'test-message-v1',
				version: '1.0.0',
				exchange: 'test-exchange',
				event: 'test-event',
				schema: testSchema,
			};
			service.registerSchema(schemaDefinition);
		});

		it('should retrieve schema by ID', () => {
			const schema = service.getSchema('test-exchange', 'test-event', '1.0.0');

			expect(schema).toBeDefined();
			expect(schema!.id).toBe('test-message-v1');
			expect(schema!.version).toBe('1.0.0');
		});

		it('should list schema versions', () => {
			// Register another version
			const schemaDefinition2: Omit<MessageSchema<TestMessage>, 'createdAt'> = {
				id: 'test-message-v2',
				version: '2.0.0',
				exchange: 'test-exchange',
				event: 'test-event',
				schema: testSchema,
			};
			service.registerSchema(schemaDefinition2);

			const versions = service.getSchemaVersions('test-exchange', 'test-event');

			expect(versions).toHaveLength(2);
			expect(versions).toContain('1.0.0');
			expect(versions).toContain('2.0.0');
		});

		it('should remove schema', () => {
			expect(service.hasSchema('test-exchange', 'test-event', '1.0.0')).toBe(true);

			const removed = service.removeSchema('test-exchange', 'test-event', '1.0.0');

			expect(removed).toBe(true);
			expect(service.hasSchema('test-exchange', 'test-event', '1.0.0')).toBe(false);
		});

		it('should return all schemas', () => {
			const allSchemas = service.getAllSchemas();

			expect(allSchemas).toHaveLength(1);
			expect(allSchemas[0].id).toBe('test-message-v1');
		});
	});
});
