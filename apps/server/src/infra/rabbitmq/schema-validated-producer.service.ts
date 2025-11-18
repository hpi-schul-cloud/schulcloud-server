import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { SchemaRegistryService, ValidationResult } from './schema-registry.service';

export interface ValidatedPublishOptions {
	exchange: string;
	routingKey: string;
	message: unknown;
	schemaVersion?: string;
	strict?: boolean; // If true, throw error on validation failure
}

export interface PublishResult {
	success: boolean;
	validationResult?: ValidationResult;
	error?: string;
}

@Injectable()
export class SchemaValidatedProducerService {
	private readonly logger = new Logger(SchemaValidatedProducerService.name);

	constructor(
		private readonly amqpConnection: AmqpConnection,
		private readonly schemaRegistry: SchemaRegistryService
	) {}

	/**
	 * Publish a message with schema validation
	 */
	public async publishWithValidation(options: ValidatedPublishOptions): Promise<PublishResult> {
		const { exchange, routingKey, message, schemaVersion = '1.0.0', strict = false } = options;

		// Validate message against schema
		const validationResult = this.schemaRegistry.validateMessage(exchange, routingKey, schemaVersion, message);

		if (!validationResult.isValid) {
			this.logger.warn(`Message validation failed for ${exchange}:${routingKey}`, validationResult.errors);

			if (strict) {
				throw new Error(`Message validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`);
			}

			return {
				success: false,
				validationResult,
				error: 'Message validation failed',
			};
		}

		try {
			// Add schema metadata to message
			const enrichedMessage = {
				...(message as object),
				__schema: {
					exchange,
					event: routingKey,
					version: schemaVersion,
					timestamp: new Date().toISOString(),
				},
			};

			await this.amqpConnection.publish(exchange, routingKey, enrichedMessage);

			this.logger.debug(`Message published successfully to ${exchange}:${routingKey}`);
			return { success: true, validationResult };
		} catch (error) {
			this.logger.error(`Failed to publish message to ${exchange}:${routingKey}`, error);
			return {
				success: false,
				validationResult,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Publish a message without validation (for backward compatibility)
	 */
	public async publish(exchange: string, routingKey: string, message: unknown): Promise<void> {
		await this.amqpConnection.publish(exchange, routingKey, message);
	}

	/**
	 * Check if a message would be valid before publishing
	 */
	public validateMessageBeforePublish(
		exchange: string,
		routingKey: string,
		message: unknown,
		schemaVersion = '1.0.0'
	): ValidationResult {
		return this.schemaRegistry.validateMessage(exchange, routingKey, schemaVersion, message);
	}
}
