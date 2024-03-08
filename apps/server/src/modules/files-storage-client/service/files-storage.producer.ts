import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
	CopyFileDO,
	CopyFilesOfParentParams,
	FileDO,
	FilesStorageEvents,
	FilesStorageExchange,
	RpcMessageProducer,
} from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageClientConfig } from '../files-storage-client-config';

@Injectable()
export class FilesStorageProducer extends RpcMessageProducer {
	constructor(
		protected readonly amqpConnection: AmqpConnection,
		private readonly logger: LegacyLogger,
		protected readonly configService: ConfigService<FilesStorageClientConfig, true>
	) {
		super(amqpConnection, FilesStorageExchange, configService.get('INCOMING_REQUEST_TIMEOUT_COPY_API'));
		this.logger.setContext(FilesStorageProducer.name);
	}

	async copyFilesOfParent(payload: CopyFilesOfParentParams): Promise<CopyFileDO[]> {
		this.logger.debug({ action: 'copyFilesOfParent:started', payload });
		const response = await this.request<CopyFileDO[]>(FilesStorageEvents.COPY_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'copyFilesOfParent:finished', payload });

		return response;
	}

	async listFilesOfParent(payload: EntityId): Promise<FileDO[]> {
		this.logger.debug({ action: 'listFilesOfParent:started', payload });
		const response = await this.request<FileDO[]>(FilesStorageEvents.LIST_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'listFilesOfParent:finished', payload });

		return response;
	}

	async deleteFilesOfParent(payload: EntityId): Promise<FileDO[]> {
		this.logger.debug({ action: 'deleteFilesOfParent:started', payload });
		const response = await this.request<FileDO[]>(FilesStorageEvents.DELETE_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'deleteFilesOfParent:finished', payload });

		return response;
	}

	async deleteFiles(payload: EntityId[]): Promise<FileDO[]> {
		this.logger.debug({ action: 'deleteFiles:started', payload });
		const response = await this.request<FileDO[]>(FilesStorageEvents.DELETE_FILES, payload);

		this.logger.debug({ action: 'deleteFiles:finished', payload });

		return response;
	}

	async removeCreatorIdFromFileRecords(payload: EntityId): Promise<FileDO[]> {
		this.logger.debug({ action: 'removeCreatorIdFromFileRecords:started', payload });
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const response = await this.request<FileDO[]>(FilesStorageEvents.REMOVE_CREATORID_OF_FILES, payload);

		this.logger.debug({ action: 'removeCreatorIdFromFileRecords:finished', payload });

		return response;
	}
}
