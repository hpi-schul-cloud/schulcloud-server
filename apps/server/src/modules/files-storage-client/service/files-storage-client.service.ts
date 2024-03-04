import { Injectable } from '@nestjs/common';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FileDO } from '@src/infra/rabbitmq';
import { DeletionService, DomainDeletionReport } from '@shared/domain/interface';
import { DomainDeletionReportBuilder, DomainOperationReportBuilder } from '@shared/domain/builder';
import { EventsHandler, IEventHandler, EventBus } from '@nestjs/cqrs';
import { UserDeletedEvent, DataDeletedEvent } from '@src/modules/deletion/event';
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
		private readonly eventBus: EventBus
	) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	async handle({ deletionRequest }: UserDeletedEvent) {
		const dataDeleted = await this.deleteUserData(deletionRequest.targetRefId);
		await this.eventBus.publish(new DataDeletedEvent(deletionRequest, dataDeleted));
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

	async deleteOneFile(fileRecordId: EntityId): Promise<FileDto> {
		const response = await this.fileStorageMQProducer.deleteOneFile(fileRecordId);

		const fileInfo = FilesStorageClientMapper.mapFileRecordResponseToFileDto(response);

		return fileInfo;
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
