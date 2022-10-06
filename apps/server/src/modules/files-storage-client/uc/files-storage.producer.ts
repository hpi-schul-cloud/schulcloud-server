import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { Logger } from '@src/core/logger';
import {
	FilesStorageEvents,
	FilesStorageExchanges,
	ICopyFileDO,
	ICopyFilesOfParentParams,
	IFileDO,
	IFileRecordParams,
} from '@src/shared/infra/rabbitmq';
import { IFilesStorageClientConfig } from '../interfaces';
import { ErrorMapper } from '../mapper/error.mapper';

@Injectable()
export class FilesStorageProducer {
	private timeout = 0;

	constructor(
		private readonly logger: Logger,
		private readonly amqpConnection: AmqpConnection,
		private readonly configService: ConfigService<IFilesStorageClientConfig, true>
	) {
		this.logger.setContext(FilesStorageProducer.name);
		this.timeout = this.configService.get('INCOMING_REQUEST_TIMEOUT');
	}

	async copyFilesOfParent(payload: ICopyFilesOfParentParams): Promise<ICopyFileDO[]> {
		this.logger.debug({ action: 'copyFilesOfParent', payload });
		const response = await this.amqpConnection.request<RpcMessage<ICopyFileDO[]>>({
			exchange: FilesStorageExchanges.FILES_STORAGE,
			routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
			payload,
			timeout: this.timeout,
		});

		this.checkError(response);
		return response.message || [];
	}

	async listFilesOfParent(payload: IFileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'listFilesOfParent', payload });
		const response = await this.amqpConnection.request<RpcMessage<IFileDO[]>>({
			exchange: FilesStorageExchanges.FILES_STORAGE,
			routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
			payload,
			timeout: this.timeout,
		});

		this.checkError(response);
		return response.message || [];
	}

	async deleteFilesOfParent(payload: IFileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'deleteFilesOfParent', payload });
		const response = await this.amqpConnection.request<RpcMessage<IFileDO[]>>({
			exchange: FilesStorageExchanges.FILES_STORAGE,
			routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
			payload,
			timeout: this.timeout,
		});

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
}
