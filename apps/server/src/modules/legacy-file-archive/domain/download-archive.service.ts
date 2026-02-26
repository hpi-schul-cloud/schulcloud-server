import { S3Client } from '@aws-sdk/client-s3';
import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { S3ClientAdapter, S3Config } from '@infra/s3-client';
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { EntityId } from '@shared/domain/types';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';
import { ArchiveFactory } from './archive.factory';
import { FileResponseFactory } from './file-response.factory';
import { GetFileResponse, OwnerType } from './interfaces';

@Injectable()
export class DownloadArchiveService implements OnModuleInit {
	private s3Clients = new Map<string, { s3Client: S3Client; provider: StorageProviderEntity }>();

	constructor(
		private readonly logger: Logger,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly filesRepo: FilesRepo,
		private readonly domainErrorHandler: DomainErrorHandler
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async onModuleInit(): Promise<void> {
		await this.initializeS3Clients();
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

	private async initializeS3Clients(): Promise<void> {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((provider) => {
			const s3Client = this.createS3Client(provider);
			this.s3Clients.set(provider.id, { s3Client, provider });
		});
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
		const { s3Client, provider } = this.getClientForFile(file);
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

	private getClientForFile(file: FileEntity): { s3Client: S3Client; provider: StorageProviderEntity } {
		const storageProvider = TypeGuard.checkNotNullOrUndefined(
			file.storageProvider,
			new Error(`File ${file.id} has no provider.`)
		);

		const clientProviderObject = this.s3Clients.get(storageProvider.id);
		const checkedClient = TypeGuard.checkNotNullOrUndefined(
			clientProviderObject?.s3Client,
			new Error('Provider is invalid.')
		);
		const checkedProvider = TypeGuard.checkNotNullOrUndefined(
			clientProviderObject?.provider,
			new Error('Provider is invalid.')
		);

		return { s3Client: checkedClient, provider: checkedProvider };
	}
}
