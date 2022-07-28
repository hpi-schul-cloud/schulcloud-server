import CryptoJs from 'crypto-js';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@src/core/logger';

@Injectable()
export class SymetricKeyEncryptionService {
	private key?: string;

	constructor(private configService: ConfigService, private logger: Logger) {
		this.key = this.configService.get<string>('AES_KEY');
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
