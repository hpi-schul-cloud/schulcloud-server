import { Injectable } from '@nestjs/common';
import { ICopyFileDO, IFileDO } from '@shared/infra/rabbitmq';
import { Logger } from '@src/core/logger';
import { CopyFileDto, FileDto } from '../dto';
import { FileRequestInfo } from '../interfaces';
import { CopyFilesRequestInfo } from '../interfaces/copy-file-request-info';
import { FilesStorageClientMapper } from '../mapper';
import { FilesStorageProducer } from './files-storage.producer';

@Injectable()
export class FilesStorageClientAdapterService {
	constructor(private logger: Logger, private readonly fileStorageMQProducer: FilesStorageProducer) {
		this.logger.setContext(FilesStorageClientAdapterService.name);
	}

	async copyFilesOfParent(param: CopyFilesRequestInfo): Promise<CopyFileDto[]> {
		const response = await this.copy(param);
		const fileInfos = FilesStorageClientMapper.mapCopyFileListResponseToCopyFilesDto(response);

		return fileInfos;
	}

	async listFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const response = await this.list(param);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	async deleteFilesOfParent(param: FileRequestInfo): Promise<FileDto[]> {
		const response = await this.delete(param);

		const fileInfos = FilesStorageClientMapper.mapfileRecordListResponseToDomainFilesDto(response);

		return fileInfos;
	}

	private async copy(param: CopyFilesRequestInfo): Promise<ICopyFileDO[]> {
		const response = await this.fileStorageMQProducer.copyFilesOfParent(param);
		return response;
	}

	private async list(param: FileRequestInfo): Promise<IFileDO[]> {
		const response = await this.fileStorageMQProducer.listFilesOfParent(param);
		return response;
	}

	private async delete(param: FileRequestInfo): Promise<IFileDO[]> {
		const response = await this.fileStorageMQProducer.deleteFilesOfParent(param);
		return response;
	}
}
