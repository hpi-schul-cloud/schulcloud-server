/* eslint-disable no-await-in-loop */
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { File, StorageProvider } from '@shared/domain';
import { StorageProviderRepo } from '@shared/repo/storageprovider/storageprovider.repo';
import { LegacyLogger } from '@src/core/logger/legacy-logger.service';

import { FilesRepo } from '../repo';

@Injectable()
export class DeleteFilesUc {
	private s3ClientMap: Map<string, S3Client> = new Map();

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
			const files = await this.filesRepo.findFilesForCleanup(thresholdDate, batchSize, offset);

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

	private async initializeS3ClientMap() {
		const providers = await this.storageProviderRepo.findAll();

		providers.forEach((provider) => {
			this.s3ClientMap.set(provider.id, this.createClient(provider));
		});

		this.logger.log(`Initialized s3ClientMap with ${this.s3ClientMap.size} clients.`);
	}

	private createClient(storageProvider: StorageProvider): S3Client {
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

	private async deleteFile(file: File): Promise<{ fileId: string; success: boolean }> {
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

	private async deleteFileInStorage(file: File) {
		const bucket = file.bucket as string;
		const storageFileName = file.storageFileName as string;
		const deletionCommand = new DeleteObjectCommand({ Bucket: bucket, Key: storageFileName });

		const storageProvider = file.storageProvider as StorageProvider;
		const client = this.s3ClientMap.get(storageProvider.id) as S3Client;

		await client.send(deletionCommand);
	}
}
