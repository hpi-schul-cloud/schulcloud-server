import { Configuration } from '@hpi-schul-cloud/commons';
import { Type } from '@mikro-orm/core';
import CryptoJs from 'crypto-js';

/**
 * Serialization type to transparent encrypt string values in database.
 */
export class StorageProviderEncryptedStringType extends Type<string, string> {
	// TODO modularize service?
	private key: string;

	constructor(customKey?: string) {
		super();
		if (customKey) {
			this.key = customKey;
		} else {
			this.key = Configuration.get('S3_KEY') as string;
		}
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
		const encryptedString = CryptoJs.AES.encrypt(value, this.key).toString();

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

		// decrypt only non-empty strings
		const decryptedString: string = CryptoJs.AES.decrypt(value, this.key).toString(CryptoJs.enc.Utf8);

		return decryptedString;
	}
}
