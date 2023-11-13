import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
	FilesStorageEvents,
	FilesStorageExchange,
	ICopyFileDO,
	ICopyFilesOfParentParams,
	IFileDO,
	IFileRecordParams,
	RpcMessageProducer,
} from '@infra/rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageClientConfig } from '../interfaces';

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

	async copyFilesOfParent(payload: ICopyFilesOfParentParams): Promise<ICopyFileDO[]> {
		this.logger.debug({ action: 'copyFilesOfParent:started', payload });
		const response = await this.request<ICopyFileDO[]>(FilesStorageEvents.COPY_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'copyFilesOfParent:finished', payload });

		return response;
	}

	async listFilesOfParent(payload: IFileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'listFilesOfParent:started', payload });
		const response = await this.request<IFileDO[]>(FilesStorageEvents.LIST_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'listFilesOfParent:finished', payload });

		return response;
	}

	async deleteFilesOfParent(payload: EntityId): Promise<IFileDO[]> {
		this.logger.debug({ action: 'deleteFilesOfParent:started', payload });
		const response = await this.request<IFileDO[]>(FilesStorageEvents.DELETE_FILES_OF_PARENT, payload);

		this.logger.debug({ action: 'deleteFilesOfParent:finished', payload });

		return response;
	}
}
