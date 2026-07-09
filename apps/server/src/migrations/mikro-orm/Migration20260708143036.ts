import { Migration } from '@mikro-orm/migrations-mongodb';
import { AesEncryptionHelper } from '@shared/common/utils';

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

		const collection = this.getCollection(this.collectionName);
		const cursor = collection.find({ refreshToken: { $type: 'string' } });

		for await (const item of cursor) {
			try {
				const { refreshToken } = item;

				if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
					console.error(
						`oauth-session-token with id ${item._id.toString()} has no or empty refresh token and was omitted.`
					);
					numberOfFailedUpdates += 1;
					continue;
				}

				// Avoid double-encrypting tokens (e.g. if the migration runs while the app already stores encrypted tokens)
				try {
					AesEncryptionHelper.decrypt(refreshToken, AES_KEY);
					console.info(
						`oauth-session-token with id ${item._id.toString()} was omitted because the refresh token is already encrypted.`
					);
					continue;
				} catch {
					// Token is not decryptable with the current key => treat as plaintext
				}

				const encrypted = AesEncryptionHelper.encrypt(refreshToken, AES_KEY);

				await collection.updateOne({ _id: item._id }, { $set: { refreshToken: encrypted } });

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

	async down(): Promise<void> {
		console.info(`Start decrypting refreshTokens in collection ${this.collectionName}.`);

		// eslint-disable-next-line no-process-env
		const { AES_KEY } = process.env;

		if (!AES_KEY) {
			throw new Error('AES_KEY is not provided. Migration cannot proceed.');
		}

		let numberOfUpdatedTokens = 0;
		let numberOfFailedUpdates = 0;

		const cursor = this.getCollection(this.collectionName).find({});

		for await (const item of cursor) {
			try {
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
