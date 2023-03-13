import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { CopyFileDto, FileDto } from '../dto';
import { IFileRequestInfo } from '../interfaces';
import { ICopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FilesStorageClientMapper } from '../mapper';
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

	async deleteFilesOfParent(param: IFileRequestInfo): Promise<FileDto[]> {
		const response = await this.fileStorageMQProducer.deleteFilesOfParent(param);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}
}
