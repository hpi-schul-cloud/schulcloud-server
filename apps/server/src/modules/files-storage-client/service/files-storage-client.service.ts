import { LegacyLogger } from '@core/logger';
import { FileDO } from '@infra/rabbitmq';
import {
	DeletionService,
	DomainDeletionReport,
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { CopyFileDto, FileDto } from '../dto';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FilesStorageClientMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

@Injectable()
export class FilesStorageClientAdapterService implements DeletionService {
	constructor(
		private logger: LegacyLogger,
		private readonly fileStorageMQProducer: FilesStorageProducer,
		userDeletionInjectionService: UserDeletionInjectionService
	) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
		userDeletionInjectionService.injectUserDeletionService(this);
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
