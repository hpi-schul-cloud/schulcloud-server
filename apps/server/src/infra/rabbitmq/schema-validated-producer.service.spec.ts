import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SchemaRegistryService } from './schema-registry.service';
import { SchemaValidatedProducerService } from './schema-validated-producer.service';

describe('SchemaValidatedProducerService', () => {
	let service: SchemaValidatedProducerService;
	let amqpConnection: DeepMocked<AmqpConnection>;
	let schemaRegistry: DeepMocked<SchemaRegistryService>;

	interface TestMessage {
		id: string;
		name: string;
		count: number;
	}

	const testSchema = {
		type: 'object',
		properties: {
			id: { type: 'string' },
			name: { type: 'string' },
			count: { type: 'number' },
		},
		required: ['id', 'name', 'count'],
		additionalProperties: false,
	};

	beforeEach(async () => {
		amqpConnection = createMock<AmqpConnection>();
		schemaRegistry = createMock<SchemaRegistryService>();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SchemaValidatedProducerService,
				{ provide: AmqpConnection, useValue: amqpConnection },
				{ provide: SchemaRegistryService, useValue: schemaRegistry },
			],
		}).compile();

		service = module.get<SchemaValidatedProducerService>(SchemaValidatedProducerService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('publishWithValidation', () => {
		const validMessage: TestMessage = {
			id: 'test-id',
			name: 'Test Name',
			count: 42,
		};

		it('should publish message when validation passes', async () => {
			// Mock successful validation
			schemaRegistry.validateMessage.mockReturnValue({
				isValid: true,
				errors: [],
			});

			amqpConnection.publish.mockResolvedValue(true);

			const result = await service.publishWithValidation({
				exchange: 'test-exchange',
				routingKey: 'test-event',
				message: validMessage,
			});

			expect(result.success).toBe(true);
			expect(result.validationResult?.isValid).toBe(true);
			expect(amqpConnection.publish).toHaveBeenCalledWith(
				'test-exchange',
				'test-event',
				expect.objectContaining({
					...validMessage,
					__schema: expect.objectContaining({
						exchange: 'test-exchange',
						event: 'test-event',
						version: '1.0.0',
					}),
				})
			);
		});

		it('should not publish when validation fails in strict mode', async () => {
			// Mock failed validation
			schemaRegistry.validateMessage.mockReturnValue({
				isValid: false,
				errors: [{ message: 'Validation failed' }],
			});

			await expect(
				service.publishWithValidation({
					exchange: 'test-exchange',
					routingKey: 'test-event',
					message: validMessage,
					strict: true,
				})
			).rejects.toThrow('Message validation failed');

			expect(amqpConnection.publish).not.toHaveBeenCalled();
		});

		it('should return failure result when validation fails in non-strict mode', async () => {
			// Mock failed validation
			const validationResult = {
				isValid: false,
				errors: [{ message: 'Validation failed' }],
			};
			schemaRegistry.validateMessage.mockReturnValue(validationResult);

			const result = await service.publishWithValidation({
				exchange: 'test-exchange',
				routingKey: 'test-event',
				message: validMessage,
				strict: false,
			});

			expect(result.success).toBe(false);
			expect(result.validationResult).toEqual(validationResult);
			expect(result.error).toBe('Message validation failed');
			expect(amqpConnection.publish).not.toHaveBeenCalled();
		});

		it('should handle AMQP publish errors', async () => {
			// Mock successful validation
			schemaRegistry.validateMessage.mockReturnValue({
				isValid: true,
				errors: [],
			});

			// Mock AMQP publish error
			const publishError = new Error('AMQP connection error');
			amqpConnection.publish.mockRejectedValue(publishError);

			const result = await service.publishWithValidation({
				exchange: 'test-exchange',
				routingKey: 'test-event',
				message: validMessage,
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('AMQP connection error');
		});
	});

	describe('validateMessageBeforePublish', () => {
		it('should return validation result from schema registry', () => {
			const expectedResult = {
				isValid: true,
				errors: [],
			};
			schemaRegistry.validateMessage.mockReturnValue(expectedResult);

			const result = service.validateMessageBeforePublish('test-exchange', 'test-event', {
				id: 'test',
				name: 'test',
				count: 1,
			});

			expect(result).toEqual(expectedResult);
			expect(schemaRegistry.validateMessage).toHaveBeenCalledWith('test-exchange', 'test-event', '1.0.0', {
				id: 'test',
				name: 'test',
				count: 1,
			});
		});
	});

	describe('publish', () => {
		it('should publish message without validation', async () => {
			amqpConnection.publish.mockResolvedValue(true);

			await service.publish('test-exchange', 'test-event', { data: 'test' });

			expect(amqpConnection.publish).toHaveBeenCalledWith('test-exchange', 'test-event', { data: 'test' });
			expect(schemaRegistry.validateMessage).not.toHaveBeenCalled();
		});
	});
});
