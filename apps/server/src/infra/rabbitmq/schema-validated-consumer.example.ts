import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { SchemaRegistryService } from './schema-registry.service';

/**
 * Example consumer that validates incoming messages against schemas
 * This is a template showing how to implement schema validation in consumers
 */
@Injectable()
export class SchemaValidatedConsumerExample {
	private readonly logger = new Logger(SchemaValidatedConsumerExample.name);

	constructor(private readonly schemaRegistry: SchemaRegistryService) {}

	/**
	 * Example of a consumer that validates messages
	 */
	@RabbitSubscribe({
		exchange: 'example-exchange',
		routingKey: 'example-event',
		queue: 'example-queue',
	})
	public async handleValidatedMessage(@RabbitPayload() payload: unknown): Promise<void> {
		try {
			// Extract schema metadata if available
			const message = payload as any;
			const schemaInfo = message.__schema;

			if (schemaInfo) {
				// Validate using schema metadata
				const validationResult = this.schemaRegistry.validateMessage(
					schemaInfo.exchange,
					schemaInfo.event,
					schemaInfo.version,
					message
				);

				if (!validationResult.isValid) {
					this.logger.error('Received invalid message', { errors: validationResult.errors, message });
					return;
				}
			} else {
				// Fallback validation using queue info
				const validationResult = this.schemaRegistry.validateMessage(
					'example-exchange',
					'example-event',
					'1.0.0',
					message
				);

				if (!validationResult.isValid) {
					this.logger.warn('Message validation failed, processing anyway', validationResult.errors);
				}
			}

			// Process the validated message
			this.logger.log('Processing validated message', { payload });
			// Your business logic here...
		} catch (error) {
			this.logger.error('Error processing message', error);
			throw error; // Re-throw to trigger message retry/dead letter
		}
	}
}
