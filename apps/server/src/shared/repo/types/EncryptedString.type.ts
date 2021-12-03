import { Configuration } from '@hpi-schul-cloud/commons';
import { Type, Platform } from '@mikro-orm/core';
import { SymetricKeyEncryptionService } from '../../infra/encryption';

/**
 * Serialization type to transparent encrypt string values in database.
 */
export class EncryptedStringType extends Type<string, string> {
	// TODO modularize service?
	private encryptionService: SymetricKeyEncryptionService;

	constructor(customKey?: string) {
		super();
		if (customKey) {
			this.encryptionService = new SymetricKeyEncryptionService(customKey);
		} else {
			this.encryptionService = new SymetricKeyEncryptionService(Configuration.get('S3_KEY') as string);
		}
	}

	convertToDatabaseValue(value: string | undefined, platform: Platform): string {
		// keep nullish values
		if (!value) {
			return value as string;
		}

		// encrypt non-empty strings only
		if (value?.length === 0) {
			return '';
		}
		const encryptedString = this.encryptionService.encrypt(value);

		return encryptedString;
	}

	convertToJSValue(value: string | undefined, platform: Platform): string {
		// keep nullish values
		if (!value) {
			return value as string;
		}

		// decrypt non-empty strings only
		if (value?.length === 0) {
			return '';
		}

		// decrypt only non-empty strings
		const decryptedString: string = this.encryptionService.decrypt(value);

		return decryptedString;
	}
}
