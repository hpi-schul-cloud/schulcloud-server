import { Migration } from '@mikro-orm/migrations-mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import CryptoJS from 'crypto-js';

type StorageProvider = {
	_id: ObjectId;
	secretAccessKey: string;
};

// Update AES encrypted secretAccessKey of StorageProvider with new encryption function.
export class Migration20250710083440 extends Migration {
	public async up(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection<StorageProvider>('storageproviders').find({});

		let numberOfUpdatedStorageProviders = 0;

		for await (const provider of storageProviders) {
			const decrypted = CryptoJS.AES.decrypt(provider.secretAccessKey, S3_KEY).toString(CryptoJS.enc.Utf8);
			const encrypted = AesEncryptionHelper.encrypt(decrypted, S3_KEY);

			await this.getCollection('storageproviders').updateOne(
				{ _id: provider._id },
				{ $set: { secretAccessKey: encrypted } }
			);

			numberOfUpdatedStorageProviders += 1;
		}
		console.info(
			`Updated secretAccessKey of ${numberOfUpdatedStorageProviders} storage providers with new encryption function.`
		);
	}

	public async down(): Promise<void> {
		// eslint-disable-next-line no-process-env
		const { S3_KEY } = process.env;

		if (!S3_KEY) {
			console.error('S3_KEY is not provided. Migration cannot proceed.');
			return;
		}

		const storageProviders = this.getCollection<StorageProvider>('storageproviders').find({});

		let numberOfUpdatedStorageProviders = 0;

		for await (const provider of storageProviders) {
			const decrypted = AesEncryptionHelper.decrypt(provider.secretAccessKey, S3_KEY);
			const encrypted = CryptoJS.AES.encrypt(decrypted, S3_KEY).toString();

			await this.getCollection('storageproviders').updateOne(
				{ _id: provider._id },
				{ $set: { secretAccessKey: encrypted } }
			);

			numberOfUpdatedStorageProviders += 1;
		}

		console.info(`Reverted update of secretAccessKey of ${numberOfUpdatedStorageProviders} storage providers.`);
	}
}
