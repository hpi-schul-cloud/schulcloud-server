/* eslint-disable no-await-in-loop */
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { StorageProviderEntity } from '@shared/domain/entity';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { LegacyLogger } from '@src/core/logger';
import { TypeGuard } from '@shared/common';
import { FileEntity } from '../entity';
import { FilesRepo } from '../repo';

@Injectable()
export class DeleteFilesUc {
	private s3ClientMap = new Map<string, S3Client>();

	constructor(
		private readonly filesRepo: FilesRepo,
		private readonly storageProviderRepo: StorageProviderRepo,
		private readonly logger: LegacyLogger
	) {
		this.logger.setContext(DeleteFilesUc.name);
	}

	public async deleteMarkedFiles(thresholdDate: Date, batchSize: number): Promise<void> {
		await this.initializeS3ClientMap();

		let batchCounter = 0;
		let numberOfFilesInBatch = 0;
		let numberOfProcessedFiles = 0;
		const failingFileIds: string[] = [];

		do {
			const offset = failingFileIds.length;
			const files = await this.filesRepo.findForCleanup(thresholdDate, batchSize, offset);

			const promises = files.map((file) => this.deleteFile(file));
			const results = await Promise.all(promises);

			let numberOfFailingFilesInBatch = 0;

			results.forEach((result) => {
				if (!result.success) {
					failingFileIds.push(result.fileId);
					numberOfFailingFilesInBatch += 1;
				}
			});

			numberOfFilesInBatch = files.length;
			numberOfProcessedFiles += files.length;
			batchCounter += 1;

			this.logger.log(
				`Finished batch ${batchCounter} with ${numberOfFilesInBatch} files and ${numberOfFailingFilesInBatch} failed deletions`
			);
		} while (numberOfFilesInBatch > 0);

		this.logger.log(
			`${
				numberOfProcessedFiles - failingFileIds.length
			} out of ${numberOfProcessedFiles} files were successfully deleted`
		);

		if (failingFileIds.length > 0) {
			this.logger.error(`the following files could not be deleted: ${failingFileIds.toString()}`);
		}
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

	private async deleteFile(file: FileEntity): Promise<{ fileId: string; success: boolean }> {
		try {
			if (!file.isDirectory) {
				await this.deleteFileInStorage(file);
			}
			await this.filesRepo.delete(file);

			return { fileId: file.id, success: true };
		} catch (error) {
			this.logger.error(error);

			return { fileId: file.id, success: false };
		}
	}

	private getProviderForFile(file: FileEntity): S3Client {
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

		const client = this.getProviderForFile(file);

		await client.send(deletionCommand);
	}
}
