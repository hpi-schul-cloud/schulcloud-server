import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FileDO } from '@src/infra/rabbitmq';
import { DomainDeletionReport } from '@shared/domain/interface';
import { DomainDeletionReportBuilder } from '@shared/domain/builder';
import { CopyFileDto, FileDto } from '../dto';
import { IEventHandler, EventBus, EventsHandler } from '@nestjs/cqrs';
import {
	UserDeletedEvent,
	DeletionService,
	DataDeletedEvent,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
} from '@modules/deletion';
import { FilesStorageProducer } from './files-storage.producer';
import { FilesStorageClientMapper } from '../mapper';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { CopyFileDto, FileDto } from '../dto';

@Injectable()
@EventsHandler(UserDeletedEvent)
export class FilesStorageClientAdapterService implements DeletionService, IEventHandler<UserDeletedEvent> {
	constructor(
		private logger: LegacyLogger,
		private readonly fileStorageMQProducer: FilesStorageProducer,
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	public async handle({ deletionRequestId, targetRefId }: UserDeletedEvent): Promise<void> {
		const dataDeleted = await this.deleteUserData(targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequestId, dataDeleted));
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

	async removeCreatorIdFromFileRecords(creatorId: EntityId): Promise<DomainDeletionReport> {
	async deleteUserData(creatorId: EntityId): Promise<DomainDeletionReport> {
		const response = await this.fileStorageMQProducer.removeCreatorIdFromFileRecords(creatorId);

		const result = DomainDeletionReportBuilder.build(
			DomainName.FILERECORDS,
			OperationType.UPDATE,
			response.length,
			this.getFileRecordsId(response)
		);
		const result = DomainDeletionReportBuilder.build(DomainName.FILERECORDS, [
			DomainOperationReportBuilder.build(OperationType.UPDATE, response.length, this.getFileRecordsId(response)),
		]);

		return result;
	}

	private getFileRecordsId(files: FileDO[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
