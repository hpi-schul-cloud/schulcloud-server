import { Type } from '@mikro-orm/core';
import { AesEncryptionHelper } from '@shared/common/utils';

/**
 * Serialization type to transparent encrypt string values in database.
 */
export class StorageProviderEncryptedStringType extends Type<string, string> {
	constructor(private customKey?: string) {
		super();
	}

	private get key(): string {
		if (this.customKey) {
			return this.customKey;
		}
		// eslint-disable-next-line no-process-env
		const s3Key = process.env.S3_KEY;
		if (!s3Key) {
			throw new Error('Environment variable S3_KEY is not defined');
		}
		return s3Key;
	}

	public convertToDatabaseValue(value: string | undefined): string {
		// keep nullish values
		if (value == null) {
			return value as unknown as string;
		}

		// encrypt non-empty strings only
		if (value.length === 0) {
			return '';
		}
		const encryptedString = AesEncryptionHelper.encrypt(value, this.key);

		return encryptedString;
	}

	public convertToJSValue(value: string | undefined): string {
		// keep nullish values
		if (value == null) {
			return value as unknown as string;
		}

		// decrypt non-empty strings only
		if (value.length === 0) {
			return '';
		}

		const decryptedString = AesEncryptionHelper.decrypt(value, this.key);

		return decryptedString;
	}
}
