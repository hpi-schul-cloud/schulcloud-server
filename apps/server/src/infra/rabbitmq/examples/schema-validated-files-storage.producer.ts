import { Injectable, Logger } from '@nestjs/common';
import { CopyFilesOfParentParams, FilesStorageEvents } from '../exchange/files-storage';
import { FilesStorageExchange } from '../rabbitmq.config';
import { SchemaValidatedProducerService } from '../schema-validated-producer.service';

/**
 * Example producer using schema validation
 * This replaces the traditional RpcMessageProducer with schema-validated messaging
 */
@Injectable()
export class SchemaValidatedFilesStorageProducer {
	private readonly logger = new Logger(SchemaValidatedFilesStorageProducer.name);

	constructor(private readonly producer: SchemaValidatedProducerService) {}

	/**
	 * Copy files with schema validation
	 */
	public async copyFilesOfParent(params: CopyFilesOfParentParams): Promise<void> {
		try {
			// Validate and publish the message
			const result = await this.producer.publishWithValidation({
				exchange: FilesStorageExchange,
				routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
				message: params,
				schemaVersion: '1.0.0',
				strict: true, // Throw on validation failure
			});

			if (result.success) {
				this.logger.log('Files copy request sent successfully', {
					sourceParentId: params.source.parentId,
					targetParentId: params.target.parentId,
				});
			}
		} catch (error) {
			this.logger.error('Failed to send files copy request', {
				params,
				error: error.message,
			});
			throw error;
		}
	}

	/**
	 * Delete files of parent with schema validation
	 */
	public async deleteFilesOfParent(
		storageLocationId: string,
		storageLocation: string,
		parentId: string,
		parentType: string
	): Promise<void> {
		const params = {
			storageLocationId,
			storageLocation,
			parentId,
			parentType,
		};

		// First validate the message without publishing
		const validationResult = this.producer.validateMessageBeforePublish(
			FilesStorageExchange,
			FilesStorageEvents.DELETE_FILES_OF_PARENT,
			params
		);

		if (!validationResult.isValid) {
			this.logger.error('Invalid delete files request', {
				params,
				errors: validationResult.errors,
			});
			throw new Error(`Invalid delete files request: ${validationResult.errors.map((e) => e.message).join(', ')}`);
		}

		// Publish the validated message
		await this.producer.publishWithValidation({
			exchange: FilesStorageExchange,
			routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
			message: params,
			schemaVersion: '1.0.0',
			strict: false, // Use non-strict mode and handle result
		});

		this.logger.log('Files deletion request sent', { parentId });
	}

	/**
	 * Delete specific files with graceful error handling
	 */
	public async deleteFiles(fileIds: string[]): Promise<boolean> {
		if (!fileIds || fileIds.length === 0) {
			this.logger.warn('No file IDs provided for deletion');
			return false;
		}

		const params = { fileIds };

		// Use non-strict validation for graceful handling
		const result = await this.producer.publishWithValidation({
			exchange: FilesStorageExchange,
			routingKey: FilesStorageEvents.DELETE_FILES,
			message: params,
			schemaVersion: '1.0.0',
			strict: false,
		});

		if (!result.success) {
			this.logger.error('Failed to send file deletion request', {
				fileIds,
				validationErrors: result.validationResult?.errors,
				publishError: result.error,
			});
			return false;
		}

		this.logger.log('File deletion request sent successfully', {
			fileCount: fileIds.length,
		});
		return true;
	}

	/**
	 * Remove creator ID from files
	 */
	public async removeCreatorIdOfFiles(creatorId: string): Promise<void> {
		const params = { creatorId };

		try {
			await this.producer.publishWithValidation({
				exchange: FilesStorageExchange,
				routingKey: FilesStorageEvents.REMOVE_CREATORID_OF_FILES,
				message: params,
				schemaVersion: '1.0.0',
				strict: true,
			});

			this.logger.log('Creator ID removal request sent', { creatorId });
		} catch (error) {
			this.logger.error('Failed to send creator ID removal request', {
				creatorId,
				error: error.message,
			});
			throw error;
		}
	}
}
