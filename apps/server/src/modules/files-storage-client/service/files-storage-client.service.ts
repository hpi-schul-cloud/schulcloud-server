import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types/entity-id';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';
import { CopyFileDto } from '../dto/copy-file.dto';
import { FileDto } from '../dto/file.dto';
import { ICopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { IFileRequestInfo } from '../interfaces/file-request-info';
import { FilesStorageClientMapper } from '../mapper/files-storage-client.mapper';
import { FilesStorageProducer } from './files-storage.producer';

@Injectable()
export class FilesStorageClientAdapterService {
	constructor(private logger: LegacyLogger, private readonly fileStorageMQProducer: FilesStorageProducer) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	async copyFilesOfParent(param: ICopyFilesRequestInfo): Promise<CopyFileDto[]> {
		const response = await this.fileStorageMQProducer.copyFilesOfParent(param);
		const fileInfos = FilesStorageClientMapper.mapCopyFileListResponseToCopyFilesDto(response);

		return fileInfos;
	}

	async listFilesOfParent(param: IFileRequestInfo): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.listFilesOfParent(param);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	async deleteFilesOfParent(parentId: EntityId): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.deleteFilesOfParent(parentId);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}
}
