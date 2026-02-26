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
	constructor(
		private readonly logger: Logger,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly filesRepo: FilesRepo,
		private readonly domainErrorHandler: DomainErrorHandler
	) {
		this.logger.setContext(DownloadArchiveService.name);
	}

	public async onModuleInit(): Promise<void> {
		await this.initializeS3ClientAdapters();
	}

	private s3Clients = new Map<string, { s3Client: S3Client; provider: StorageProviderEntity }>();

	private async initializeS3ClientAdapters(): Promise<void> {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((provider) => {
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

			this.s3Clients.set(provider.id, { s3Client, provider });
		});
	}

	public async downloadFilesAsArchive(
		ownerId: EntityId,
		ownerType: OwnerType,
		archiveName: string
	): Promise<GetFileResponse> {
		console.log(`Downloading files for ownerId: ${ownerId}, ownerType: ${ownerType}, archiveName: ${archiveName}`);
		const files = await this.filesRepo.findByIdAndOwnerType(ownerId, ownerType);

		if (files.length === 0) {
			throw new NotFoundException('No files found to download as archive');
		}

		const getFileResponses: GetFileResponse[] = await Promise.all(
			files.map(async (file) => {
				const fileData = await this.downloadFile(file);
				return {
					name: file.name,
					data: fileData.data,
				};
			})
		);

		const archive = ArchiveFactory.create(getFileResponses, files, this.logger);
		const fileResponse = FileResponseFactory.createFromArchive(archiveName, archive);

		return fileResponse;
	}

	private async downloadFile(file: FileEntity): Promise<GetFileResponse> {
		const { s3Client, provider } = this.getClientForFile(file);

		const storageFileName = TypeGuard.checkNotNullOrUndefined(file.storageFileName);
		const bucket = TypeGuard.checkNotNullOrUndefined(file.bucket);
		const region = TypeGuard.checkNotNullOrUndefined(provider.region);

		const config: S3Config = {
			bucket: bucket,
			endpoint: provider.endpointUrl,
			region: region,
			accessKeyId: provider.accessKeyId,
			secretAccessKey: provider.secretAccessKey,
		};

		const adapter = new S3ClientAdapter(s3Client, config, this.logger, this.domainErrorHandler, provider.id);

		const data = await adapter.get(storageFileName);
		const fileResponse = FileResponseFactory.create(data, file.name);

		return fileResponse;
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
