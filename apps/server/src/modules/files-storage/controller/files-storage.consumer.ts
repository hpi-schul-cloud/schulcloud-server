import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { Logger } from '@src/core/logger';
import { FilesStorageEvents, FilesStorageExchanges, ICopyFileDO, IFileDO } from '@src/shared/infra/rabbitmq';
import { FilesStorageMapper } from '../mapper/file-record.mapper';
import { FileRecordUC } from '../uc/file-record.uc';
import { FilesStorageUC } from '../uc/files-storage.uc';
import { CopyFilesOfParentPayload, FileRecordParams } from './dto';

@Injectable()
export class FilesStorageConsumer {
	constructor(
		private readonly filesStorageUC: FilesStorageUC,
		private readonly fileRecordUC: FileRecordUC,
		private logger: Logger,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		private readonly orm: MikroORM // don't remove it, we need it for @UseRequestContext
	) {
		this.logger.setContext(FilesStorageConsumer.name);
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.COPY_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async copyFilesOfParent(@RabbitPayload() payload: CopyFilesOfParentPayload): Promise<ICopyFileDO[]> {
		this.logger.debug({ action: 'copyFilesOfParent', payload });

		const { userId, source, target } = payload;
		const [response] = await this.filesStorageUC.copyFilesOfParent(userId, source, { target });
		return response;
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.LIST_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async fileRecordsOfParent(@RabbitPayload() payload: FileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'fileRecordsOfParent', payload });

		const [fileRecords, total] = await this.fileRecordUC.fileRecordsOfParent('REMOVE_IF_MOVED_TO_SERVICE', payload);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return response.data;
	}

	@RabbitRPC({
		exchange: FilesStorageExchanges.FILES_STORAGE,
		routingKey: FilesStorageEvents.DELETE_FILES_OF_PARENT,
	})
	@UseRequestContext()
	public async deleteFilesOfParent(@RabbitPayload() payload: FileRecordParams): Promise<IFileDO[]> {
		this.logger.debug({ action: 'deleteFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageUC.deleteFilesOfParent('REMOVE_IF_MOVED_TO_SERVICE', payload);
		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return response.data;
	}
}
