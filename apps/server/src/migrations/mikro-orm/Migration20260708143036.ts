import { Migration } from '@mikro-orm/migrations-mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';
import { FindCursor, WithId } from 'mongodb';

export class Migration20260708143036 extends Migration {
	private readonly collectionName = 'oauth-session-token';

	async up(): Promise<void> {
		console.info(`Start encrypting refreshTokens in collection ${this.collectionName}.`);

		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			throw new Error('AES_KEY is not provided. Migration cannot proceed.');
		}

		let numberOfUpdatedTokens = 0;
		let numberOfFailedUpdates = 0;

		const cursor = this.getCollection('oauth-session-token').find({});

		for await (const item of cursor) {
			try {
				const encrypted = AesEncryptionHelper.encrypt(item.refreshToken, AES_KEY);

				await this.getCollection(this.collectionName).updateOne(
					{ _id: item._id },
					{ $set: { refreshToken: encrypted } }
				);

				numberOfUpdatedTokens += 1;
			} catch (error) {
				numberOfFailedUpdates += 1;

				console.error(
					`Failed to encrypt refreshToken for oauthSessionToken with id ${item._id.toString()} with error:`,
					error
				);
			}
		}

		console.info(
			`Encrypted ${numberOfUpdatedTokens} refreshTokens in collection ${this.collectionName}. ${numberOfFailedUpdates} updates failed.`
		);
	}

	async down() {
		console.info(`Start decrypting refreshTokens in collection ${this.collectionName}.`);

		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			console.error('AES_KEY is not provided. Migration cannot proceed.');
			return;
		}

		let numberOfUpdatedTokens = 0;
		let numberOfFailedUpdates = 0;

		const cursor = this.getCollection('oauth-session-token').find({});

		for await (const item of cursor) {
			try {
				const decrypted = AesEncryptionHelper.decrypt(item.refreshToken, AES_KEY);

				await this.getCollection(this.collectionName).updateOne(
					{ _id: item._id },
					{ $set: { refreshToken: decrypted } }
				);

				numberOfUpdatedTokens += 1;
			} catch (error) {
				numberOfFailedUpdates += 1;

				console.error(
					`Failed to decrypt refreshToken for oauthSessionToken with id ${item._id.toString()} with error:`,
					error
				);
			}
		}

		console.info(
			`Decrypted ${numberOfUpdatedTokens} refreshTokens in collection ${this.collectionName}. ${numberOfFailedUpdates} updates failed.`
		);
	}
}
