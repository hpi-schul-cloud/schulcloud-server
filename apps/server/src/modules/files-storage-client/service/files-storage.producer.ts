import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityId } from '@shared/domain';
import { RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { LegacyLogger } from '@src/core/logger';
import {
	FilesStorageEvents,
	FilesStorageExchange,
	ICopyFileDO,
	ICopyFilesOfParentParams,
	IFileDO,
	IFileRecordParams,
} from '@src/shared/infra/rabbitmq';
import { IFilesStorageClientConfig } from '../interfaces';
import { ErrorMapper } from '../mapper/error.mapper';

@Injectable()
export class FilesStorageProducer {
	private readonly timeout = 0;

	constructor(
		private readonly logger: LegacyLogger,
		private readonly amqpConnection: AmqpConnection,
		private readonly configService: ConfigService<IFilesStorageClientConfig, true>
	) {
		this.logger.setContext(FilesStorageProducer.name);
		this.timeout = this.configService.get('INCOMING_REQUEST_TIMEOUT_COPY_API');
	}

	async copyFilesOfParent(payload: ICopyFilesOfParentParams): Promise<ICopyFileDO[]> {
		this.logger.debug({ action: 'copyFilesOfParent:started', payload });
		const response = await this.amqpConnection.request<RpcMessage<ICopyFileDO[]>>(
			this.createRequest(FilesStorageEvents.COPY_FILES_OF_PARENT, payload)
		);

		this.logger.debug({ action: 'copyFilesOfParent:finished', payload });

		this.checkError(response);
		return response.message || [];
	}

	async listFilesOfParent(payload: IFileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'listFilesOfParent:started', payload });
		const response = await this.amqpConnection.request<RpcMessage<IFileDO[]>>(
			this.createRequest(FilesStorageEvents.LIST_FILES_OF_PARENT, payload)
		);

		this.logger.debug({ action: 'listFilesOfParent:finished', payload });

		this.checkError(response);
		return response.message || [];
	}

	async deleteFilesOfParent(payload: EntityId): Promise<IFileDO[]> {
		this.logger.debug({ action: 'deleteFilesOfParent:started', payload });
		const response = await this.amqpConnection.request<RpcMessage<IFileDO[]>>(
			this.createRequest(FilesStorageEvents.DELETE_FILES_OF_PARENT, payload)
		);

		this.logger.debug({ action: 'deleteFilesOfParent:finished', payload });

		this.checkError(response);
		return response.message || [];
	}

	private checkError(response: RpcMessage<unknown>) {
		const { error } = response;
		if (error) {
			const domainError = ErrorMapper.mapErrorToDomainError(error);
			throw domainError;
		}
	}

	private createRequest(event: FilesStorageEvents, payload: IFileRecordParams | ICopyFilesOfParentParams | EntityId) {
		return {
			exchange: FilesStorageExchange,
			routingKey: event,
			payload,
			timeout: this.timeout,
		};
	}
}
