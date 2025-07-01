import { Configuration } from '@hpi-schul-cloud/commons';
import { Type } from '@mikro-orm/core';
import { encryptAES, decryptAES } from '@raisinten/aes-crypto-js';

/**
 * Serialization type to transparent encrypt string values in database.
 */
export class StorageProviderEncryptedStringType extends Type<string, string> {
	constructor(private customKey?: string) {
		super();
	}

	private get key() {
		if (this.customKey) {
			return this.customKey;
		}
		return Configuration.get('S3_KEY') as string;
	}

	convertToDatabaseValue(value: string | undefined): string {
		// keep nullish values
		if (value == null) {
			return value as unknown as string;
		}

		// encrypt non-empty strings only
		if (value.length === 0) {
			return '';
		}
		const encryptedString = encryptAES(value, this.key);

		return encryptedString;
	}

	convertToJSValue(value: string | undefined): string {
		// keep nullish values
		if (value == null) {
			return value as unknown as string;
		}

		// decrypt non-empty strings only
		if (value.length === 0) {
			return '';
		}

		const decryptedString = decryptAES(value, this.key);

		return decryptedString;
	}
}
