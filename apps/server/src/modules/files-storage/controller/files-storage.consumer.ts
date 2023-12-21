import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { CopyFileDO, FileDO, FilesStorageEvents, FilesStorageExchange } from '@infra/rabbitmq';
import { RpcMessage } from '@infra/rabbitmq/rpc-message';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FilesStorageMapper } from '../mapper';
import { FilesStorageService } from '../service/files-storage.service';
import { PreviewService } from '../service/preview.service';
import { CopyFilesOfParentPayload, FileRecordParams } from './dto';

@Injectable()
export class FilesStorageConsumer {
	constructor(
		private readonly filesStorageService: FilesStorageService,
		private readonly previewService: PreviewService,
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
	): Promise<RpcMessage<CopyFileDO[]>> {
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
	public async getFilesOfParent(@RabbitPayload() payload: FileRecordParams): Promise<RpcMessage<FileDO[]>> {
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
	public async deleteFilesOfParent(@RabbitPayload() payload: EntityId): Promise<RpcMessage<FileDO[]>> {
		this.logger.debug({ action: 'deleteFilesOfParent', payload });

		const [fileRecords, total] = await this.filesStorageService.getFileRecordsOfParent(payload);

		await this.previewService.deletePreviews(fileRecords);
		await this.filesStorageService.deleteFilesOfParent(fileRecords);

		const response = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, total);

		return { message: response.data };
	}

	@RabbitRPC({
		exchange: FilesStorageExchange,
		routingKey: FilesStorageEvents.REMOVE_CREATORID_OF_FILES,
		queue: FilesStorageEvents.REMOVE_CREATORID_OF_FILES,
	})
	@UseRequestContext()
	public async removeCreatorIdFromFileRecords(@RabbitPayload() payload: EntityId): Promise<RpcMessage<FileDO[]>> {
		this.logger.debug({ action: 'removeCreatorIdFromFileRecords', payload });

		const [fileRecords, total] = await this.filesStorageService.getFileRecordsByCreatorId(payload);
		let updatedFileRecords = await this.filesStorageService.removeCreatorIdFromFileRecords(fileRecords);
		updatedFileRecords = updatedFileRecords ?? [];

		const response = FilesStorageMapper.mapToFileRecordListResponse(updatedFileRecords, total);

		return { message: response.data };
	}
}
