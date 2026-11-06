import { DeleteObjectCommand, S3Client, S3ServiceException } from '@aws-sdk/client-s3';
import { AuthenticationClientAdapter } from '@infra/authentication-client';
import { LegacyLogger } from '@infra/logger';
import { StorageProviderEntity, StorageProviderRepo } from '@modules/school/repo';
import { Inject, Injectable } from '@nestjs/common';
import { TypeGuard } from '@shared/common/guards';
import { FileEntity } from '../entity';
import { FILES_CONSOLE_CONFIG_TOKEN, FilesConsoleConfig } from '../files-console.config';
import { FilesRepo } from '../repo';

const NO_SUCH_BUCKET = 'NoSuchBucket';

interface BatchStats {
	batchCounter: number;
	numberOfProcessedFiles: number;
	numberOfFailingFilesTotal: number;
}

@Injectable()
export class DeleteFilesUc {
	private readonly s3ClientMap = new Map<string, S3Client>();

	constructor(
		private readonly filesRepo: FilesRepo,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly logger: LegacyLogger,
		private readonly authenticationClient: AuthenticationClientAdapter,
		@Inject(FILES_CONSOLE_CONFIG_TOKEN) private readonly config: FilesConsoleConfig
	) {
		this.logger.setContext(DeleteFilesUc.name);
	}

	public async deleteMarkedFiles(thresholdDate: Date, batchSize: number): Promise<void> {
		const accessToken = await this.authenticationClient.loginServiceAccount({
			username: this.config.cronjobUsername,
			password: this.config.cronjobToken,
		});

		await this.initializeS3ClientMap();

		const { numberOfProcessedFiles, numberOfFailingFilesTotal } = await this.processBatches(thresholdDate, batchSize, {
			batchCounter: 0,
			numberOfProcessedFiles: 0,
			numberOfFailingFilesTotal: 0,
		});

		this.logger.log(
			`${
				numberOfProcessedFiles - numberOfFailingFilesTotal
			} out of ${numberOfProcessedFiles} files were successfully deleted`
		);

		if (numberOfFailingFilesTotal > 0) {
			this.logger.error(`there were ${numberOfFailingFilesTotal} files that could not be deleted`);
		}

		await this.authenticationClient.logout(accessToken);
	}

	private async processBatches(thresholdDate: Date, batchSize: number, stats: BatchStats): Promise<BatchStats> {
		const files = await this.filesRepo.findForCleanup(thresholdDate, batchSize, stats.numberOfFailingFilesTotal);
		const numberOfFilesInBatch = files.length;

		const results = await Promise.all(files.map((file) => this.deleteFile(file)));

		const filesDeletedOnS3 = results.filter((result) => result.success).map((result) => result.file);
		const numberOfFailingFilesInBatch = results.filter((result) => !result.success).length;

		await this.deleteFilesFromRepo(filesDeletedOnS3);

		const batchCounter = stats.batchCounter + 1;
		this.logger.log(
			`Finished batch ${batchCounter} with ${numberOfFilesInBatch} files and ${numberOfFailingFilesInBatch} failed deletions`
		);

		const newStats: BatchStats = {
			batchCounter,
			numberOfProcessedFiles: stats.numberOfProcessedFiles + numberOfFilesInBatch,
			numberOfFailingFilesTotal: stats.numberOfFailingFilesTotal + numberOfFailingFilesInBatch,
		};

		if (numberOfFilesInBatch === 0) {
			return newStats;
		}

		return this.processBatches(thresholdDate, batchSize, newStats);
	}

	private async initializeS3ClientMap(): Promise<void> {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((provider) => {
			this.s3ClientMap.set(provider.id, this.createClient(provider));
		});

		this.logger.log(`Initialized s3ClientMap with ${this.s3ClientMap.size} clients.`);
	}

	private createClient(storageProvider: StorageProviderEntity): S3Client {
		const client = new S3Client({
			endpoint: storageProvider.endpointUrl,
			forcePathStyle: true,
			region: storageProvider.region,
			tls: true,
			credentials: {
				accessKeyId: storageProvider.accessKeyId,
				secretAccessKey: storageProvider.secretAccessKey,
			},
		});

		return client;
	}

	private async deleteFile(file: FileEntity): Promise<{ file: FileEntity; success: boolean }> {
		try {
			if (!file.isDirectory) {
				await this.deleteFileInStorage(file);
			}

			return { file, success: true };
		} catch (error) {
			this.logger.error(error);

			return { file, success: false };
		}
	}

	private async deleteFilesFromRepo(files: FileEntity[]): Promise<void> {
		if (files.length > 0) {
			await this.filesRepo.delete(files);
		}
	}

	private getClientForFile(file: FileEntity): S3Client {
		const storageProvider = TypeGuard.checkNotNullOrUndefined(
			file.storageProvider,
			new Error(`File ${file.id} has no provider.`)
		);

		const client = this.s3ClientMap.get(storageProvider.id);
		const clientWithProvider = TypeGuard.checkNotNullOrUndefined(client, new Error('Provider is invalid.'));

		return clientWithProvider;
	}

	private async deleteFileInStorage(file: FileEntity): Promise<void> {
		const { bucket, storageFileName } = file;
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });

		const client = this.getClientForFile(file);

		try {
			await client.send(deletionCommand);
		} catch (error) {
			if (error instanceof S3ServiceException && error.name === NO_SUCH_BUCKET) {
				this.logger.warn(
					`Bucket '${bucket ?? 'unknown'}' does not exist. File '${
						file.id
					}' will be removed from database without storage deletion.`
				);

				return;
			}

			throw error;
		}
	}
}
