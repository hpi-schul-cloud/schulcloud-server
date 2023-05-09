import CryptoJs from 'crypto-js';

import { Injectable } from '@nestjs/common';
import { LegacyLogger } from '@src/core/logger';
import { IEncryptionService } from './encryption.interface';

@Injectable()
export class SymetricKeyEncryptionService implements IEncryptionService {
	constructor(private logger: LegacyLogger, private key?: string) {
		if (!this.key) {
			this.logger.warn('No AES key defined. Encryption will no work');
		}
	}

	public encrypt(data: string): string {
		if (!this.key) {
			this.logger.warn('No AES key defined. Will return plain text');
			return data;
		}
		return CryptoJs.AES.encrypt(data, this.key).toString();
	}

	public decrypt(data: string): string {
		if (!this.key) {
			this.logger.warn('No AES key defined. Will return plain text');
			return data;
		}
		return CryptoJs.AES.decrypt(data, this.key).toString(CryptoJs.enc.Utf8);
	}
}
