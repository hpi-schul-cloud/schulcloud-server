import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import {
	FilesStorageEvents,
	FilesStorageExchange,
	ICopyFileDO,
	IFileDO,
} from '@shared/infra/rabbitmq/exchange/files-storage';
import { RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { FilesStorageMapper } from '../mapper/files-storage.mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { CopyFilesOfParentPayload, FileRecordParams } from './dto/file-storage.params';

@Injectable()
export class FilesStorageConsumer {
	constructor(
		private readonly filesStorageService: FilesStorageService,
		private logger: LegacyLogger,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly orm: MikroORM // don't remove it, we need it for @UseRequestContext
	) {
		this.logger.setContext(FilesStorageConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesStorageExchange,
		routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
		queue: FilesStorageEvents.COPY_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async copyFilesOfParent(
		@RabbitPayload() payload: CopyFilesOfParentPayload
	): Promise<RpcMessage<ICopyFileDO[]>> {
		this.logger.debug({ action: 'copyFilesOfParent', payload });

		const { userId, source, target } = payload;
		const [response] = await this.filesStorageService.copyFilesOfParent(userId, source, { target });

		return { message: response };
	}

	@RabbitRPC({
		exchange: FilesStorageExchange,
		routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
		queue: FilesStorageEvents.LIST_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async getFilesOfParent(@RabbitPayload() payload: FileRecordParams): Promise<RpcMessage<IFileDO[]>> {
		this.logger.debug({ action: 'getFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageService.getFileRecordsOfParent(payload.parentId);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return { message: response.data };
	}

	@RabbitRPC({
		exchange: FilesStorageExchange,
		routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
		queue: FilesStorageEvents.DELETE_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async deleteFilesOfParent(@RabbitPayload() payload: EntityId): Promise<RpcMessage<IFileDO[]>> {
		this.logger.debug({ action: 'deleteFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageService.deleteFilesOfParent(payload);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return { message: response.data };
	}
}
