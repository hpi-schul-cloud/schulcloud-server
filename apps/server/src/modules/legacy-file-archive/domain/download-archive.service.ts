import { S3Client } from '@aws-sdk/client-s3';
import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { S3ClientAdapter, S3Config } from '@infra/s3-client';
import { StorageProviderRepo, type StorageProviderEntity } from '@modules/school/repo';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { GetFileResponse, OwnerType } from './interface';

@Injectable()
export class DownloadArchiveService {
	constructor(
		private readonly logger: Logger,
		private readonly filesRepo: FilesRepo,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly domainErrorHandler: DomainErrorHandler
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(
		ownerId: EntityId,
		ownerType: OwnerType,
		archiveName: string
	): Promise<GetFileResponse> {
		const files = await this.filesRepo.findByIdAndOwnerType(ownerId, ownerType);

		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);
		this.ensureFilesExist(downloadableFiles);

		const fileResponses = await this.downloadFiles(downloadableFiles, filesById);
		const archive = ArchiveFactory.create(fileResponses, downloadableFiles, this.logger);

		return FileResponseFactory.createFromArchive(archiveName, archive);
	}

	private createS3Client(provider: StorageProviderEntity): S3Client {
		const s3Client = new S3Client({
			endpoint: provider.endpointUrl,
			region: provider.region,
			credentials: {
				accessKeyId: provider.accessKeyId,
				secretAccessKey: provider.secretAccessKey,
			},
			forcePathStyle: true,
			tls: true,
		});

		return s3Client;
	}

	private ensureFilesExist(files: FileEntity[]): void {
		if (files.length === 0) {
			throw new NotFoundException('No files found to download as archive');
		}
	}

	private createFileMap(files: FileEntity[]): Map<EntityId, FileEntity> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileEntity[]): FileEntity[] {
		return files.filter((file) => !file.isDirectory);
	}

	private downloadFiles(files: FileEntity[], filesById: Map<EntityId, FileEntity>): Promise<GetFileResponse[]> {
		const filePromises = files.map((file) => this.downloadFileWithPath(file, filesById));

		return Promise.all(filePromises);
	}

	private async downloadFileWithPath(file: FileEntity, filesById: Map<EntityId, FileEntity>): Promise<GetFileResponse> {
		const fileData = await this.downloadFile(file);

		const fileResponse = {
			name: this.buildFilePath(file, filesById),
			data: fileData.data,
		};

		return fileResponse;
	}

	private buildFilePath(file: FileEntity, filesById: Map<EntityId, FileEntity>): string {
		const pathSegments: string[] = [];
		let currentFile: FileEntity | undefined = file;

		while (currentFile) {
			pathSegments.unshift(currentFile.name);
			currentFile = currentFile.parentId ? filesById.get(currentFile.parentId) : undefined;
		}

		return pathSegments.join('/');
	}

	private async downloadFile(file: FileEntity): Promise<GetFileResponse> {
		const { s3Client, provider } = await this.getClientForFile(file);
		const storageFileName = TypeGuard.checkNotNullOrUndefined(file.storageFileName);

		const config = this.createS3Config(file, provider);
		const adapter = new S3ClientAdapter(s3Client, config, this.logger, this.domainErrorHandler, provider.id);

		const data = await adapter.get(storageFileName);

		return FileResponseFactory.create(data, file.name);
	}

	private createS3Config(file: FileEntity, provider: StorageProviderEntity): S3Config {
		const bucket = TypeGuard.checkNotNullOrUndefined(file.bucket);
		const region = TypeGuard.checkNotNullOrUndefined(provider.region);

		const config = {
			bucket,
			endpoint: provider.endpointUrl,
			region,
			accessKeyId: provider.accessKeyId,
			secretAccessKey: provider.secretAccessKey,
		};

		return config;
	}

	private async getClientForFile(file: FileEntity): Promise<{ s3Client: S3Client; provider: StorageProviderEntity }> {
		if (!file.storageProvider?.id)
			throw new NotFoundException(`File with id ${file.id} does not have a storage provider assigned`);

		const storageProvider = await this.storageProviderRepo.findById(file.storageProvider?.id);

		const s3Client = this.createS3Client(storageProvider);

		return { s3Client, provider: storageProvider };
	}
}
