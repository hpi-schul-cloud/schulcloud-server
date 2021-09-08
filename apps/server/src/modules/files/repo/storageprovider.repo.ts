import { Injectable } from '@nestjs/common';
import { BaseRepo } from '@shared/repo/base.repo';
import { EntityId } from '@shared/domain';
import { Configuration } from '@hpi-schul-cloud/commons';
import { StorageProvider } from '../entity';

function decryptAccessKey(secretAccessKey: string): string {
	const S3_KEY = Configuration.get('S3_KEY') as string;
	return CryptoJS.AES.decrypt(secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
}

const createStorageProviderInstance = (storageProviderMetaInformation) =>
	new aws.S3(getConfig(storageProviderMetaInformation));

@Injectable()
export class FileStorageRepo extends BaseRepo<StorageProvider> {
	async findOneById(id: EntityId): Promise<StorageProvider> {
		const storageProvider = await this.em.findOneOrFail(StorageProvider, id);
		storageProvider.secretAccessKey = decryptAccessKey(storageProvider.secretAccessKey);
		return storageProvider;
	}

	async deleteFile(storageProviderId: EntityId, bucket: string, fileName: string) {
		const storageProviderInstance = createStorageProviderInstance(storageProvider);
		return storageProviderInstance.deleteObject({ Bucket: bucket, Key: fileName }).promise();
	}
}
