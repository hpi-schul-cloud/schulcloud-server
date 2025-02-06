import { LegacyLogger } from '@core/logger';
import { FileDO } from '@infra/rabbitmq';
import { MikroORM, UseRequestContext } from '@mikro-orm/core';
import {
	DataDeletedEvent,
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletedEvent,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EventBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { EntityId } from '@shared/domain/types';
import { CopyFileDto, FileDto } from '../dto';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FilesStorageClientMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class FilesStorageClientAdapterService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private logger: LegacyLogger,
		private readonly fileStorageMQProducer: FilesStorageProducer,
		private readonly eventBus: EventBus,
		private readonly orm: MikroORM
	) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	@UseRequestContext()
	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		try {
			const dataDeleted = await this.deleteUserData(targetRefId);
			await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
		} catch (error) {
			this.logger.error('error during deletionRequest proccess', error);
		}
	}

	async copyFilesOfParent(param: CopyFilesRequestInfo): Promise<CopyFileDto[]> {
		const response = await this.fileStorageMQProducer.copyFilesOfParent(param);
		const fileInfos = FilesStorageClientMapper.mapCopyFileListResponseToCopyFilesDto(response);

		return fileInfos;
	}

	async listFilesOfParent(parentId: EntityId): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.listFilesOfParent(parentId);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	async deleteFilesOfParent(parentId: EntityId): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.deleteFilesOfParent(parentId);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	async deleteFiles(fileRecordIds: EntityId[]): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.deleteFiles(fileRecordIds);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	async deleteUserData(creatorId: EntityId): Promise<DomainDeletionReport> {
		const response = await this.fileStorageMQProducer.removeCreatorIdFromFileRecords(creatorId);

		const result = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, response.length, this.getFileRecordsId(response)),
		]);

		return result;
	}

	private getFileRecordsId(files: FileDO[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
