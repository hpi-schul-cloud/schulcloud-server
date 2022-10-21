import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { RpcMessage } from '@shared/infra/rabbitmq/rpc-message';
import { Logger } from '@src/core/logger';
import { FilesStorageEvents, FilesStorageExchanges, ICopyFileDO, IFileDO } from '@src/shared/infra/rabbitmq';
import { FilesStorageMapper } from '../mapper/file-record.mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { CopyFilesOfParentPayload, FileRecordParams } from './dto';

@Injectable()
export class FilesStorageConsumer {
	constructor(
		private readonly filesStorageService: FilesStorageService,
		private readonly filesStorageUC: FilesStorageUC,
		private logger: Logger,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly orm: MikroORM // don't remove it, we need it for @UseRequestContext
	) {
		this.logger.setContext(FilesStorageConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
		queue: FilesStorageEvents.COPY_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async copyFilesOfParent(
		@RabbitPayload() payload: CopyFilesOfParentPayload
	): Promise<RpcMessage<ICopyFileDO[]>> {
		this.logger.debug({ action: 'copyFilesOfParent', payload });

		const { userId, source, target } = payload;
		const [response] = await this.filesStorageUC.copyFilesOfParent(userId, source, { target });
		return { message: response };
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
		queue: FilesStorageEvents.LIST_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async getFilesOfParent(@RabbitPayload() payload: FileRecordParams): Promise<RpcMessage<IFileDO[]>> {
		this.logger.debug({ action: 'getFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageService.getFilesOfParent(payload);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return { message: response.data };
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
		queue: FilesStorageEvents.DELETE_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async deleteFilesOfParent(@RabbitPayload() payload: FileRecordParams): Promise<RpcMessage<IFileDO[]>> {
		this.logger.debug({ action: 'deleteFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageService.deleteFilesOfParent(payload);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return { message: response.data };
	}
}
