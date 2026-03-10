import { S3Client } from '@aws-sdk/client-s3';
import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { S3ClientAdapter, S3Config } from '@infra/s3-client';
import { StorageProviderRepo, type StorageProviderEntity } from '@modules/school/repo';
import { Injectable, NotFoundException } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';

import { FileDo } from './do';
import { ArchiveFactory, FileResponseFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { GetFileResponse } from './types';

@Injectable()
export class DownloadArchiveService {
	constructor(
		private readonly logger: Logger,
		private readonly legacyFileStorageAdapter: LegacyFileStorageAdapter,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly domainErrorHandler: DomainErrorHandler
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async downloadFilesAsArchive(ownerId: EntityId, archiveName: string): Promise<GetFileResponse> {
		const files = await this.legacyFileStorageAdapter.getFilesForOwner(ownerId);
		const filesById = this.createFileMap(files);
		const downloadableFiles = this.filterDownloadableFiles(files);

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

	private createFileMap(files: FileDo[]): Map<EntityId, FileDo> {
		return new Map(files.map((file) => [file.id, file]));
	}

	private filterDownloadableFiles(files: FileDo[]): FileDo[] {
		return files.filter((file) => !file.isDirectory);
	}

	private async downloadFiles(files: FileDo[], filesById: Map<EntityId, FileDo>): Promise<GetFileResponse[]> {
		if (files.length === 0) {
			return [];
		}

		const filePromises = files.map((file) => this.downloadFileWithPath(file, filesById));

		return await Promise.all(filePromises);
	}

	private async downloadFileWithPath(file: FileDo, filesById: Map<EntityId, FileDo>): Promise<GetFileResponse> {
		const fileData = await this.downloadFile(file);

		const fileResponse = {
			name: this.buildFilePath(file, filesById),
			data: fileData.data,
		};

		return fileResponse;
	}

	private buildFilePath(file: FileDo, filesById: Map<EntityId, FileDo>): string {
		const pathSegments: string[] = [];
		let currentFile: FileDo | undefined = file;

		while (currentFile) {
			pathSegments.unshift(currentFile.name);
			currentFile = currentFile.parentId ? filesById.get(currentFile.parentId) : undefined;
		}

		return pathSegments.join('/');
	}

	private async downloadFile(file: FileDo): Promise<GetFileResponse> {
		const { s3Client, provider } = await this.getClientForFile(file);
		const storageFileName = TypeGuard.checkNotNullOrUndefined(file.storageFileName);

		const config = this.createS3Config(file, provider);
		const adapter = new S3ClientAdapter(s3Client, config, this.logger, this.domainErrorHandler, provider.id);

		const data = await adapter.get(storageFileName);

		return FileResponseFactory.create(data, file.name);
	}

	private createS3Config(file: FileDo, provider: StorageProviderEntity): S3Config {
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

	private async getClientForFile(file: FileDo): Promise<{ s3Client: S3Client; provider: StorageProviderEntity }> {
		if (!file.storageProviderId)
			throw new NotFoundException(`File with id ${file.id} does not have a storage provider assigned`);

		const storageProvider = await this.storageProviderRepo.findById(file.storageProviderId);

		const s3Client = this.createS3Client(storageProvider);

		return { s3Client, provider: storageProvider };
	}
}
