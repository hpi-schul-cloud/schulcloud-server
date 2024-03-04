import { Injectable } from '@nestjs/common';
import { DomainName, EntityId, OperationType } from '@shared/domain/types';
import { LegacyLogger } from '@src/core/logger';
import { FileDO } from '@src/infra/rabbitmq';
import { DomainOperation } from '@shared/domain/interface';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { CopyFileDto, FileDto } from '../dto';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FilesStorageClientMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

@Injectable()
export class FilesStorageClientAdapterService {
	constructor(private logger: LegacyLogger, private readonly fileStorageMQProducer: FilesStorageProducer) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
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

	async removeCreatorIdFromFileRecords(creatorId: EntityId): Promise<DomainOperation> {
		const response = await this.fileStorageMQProducer.removeCreatorIdFromFileRecords(creatorId);

		const result = DomainOperationBuilder.build(
			DomainName.FILERECORDS,
			OperationType.UPDATE,
			response.length,
			this.getFileRecordsId(response)
		);

		return result;
	}

	private getFileRecordsId(files: FileDO[]): EntityId[] {
		return files.map((file) => file.id);
	}
}
