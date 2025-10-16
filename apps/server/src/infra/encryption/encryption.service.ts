import { LegacyLogger } from '@core/logger';
import { Injectable } from '@nestjs/common';
import { AesEncryptionHelper } from '@shared/common/utils';
import { EncryptionService } from './encryption.interface';

@Injectable()
export class SymmetricKeyEncryptionService implements EncryptionService {
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
		return AesEncryptionHelper.encrypt(data, this.key);
	}

	public decrypt(data: string): string {
		if (!this.key) {
			this.logger.warn('No AES key defined. Will return plain text');
			return data;
		}
		return AesEncryptionHelper.decrypt(data, this.key);
	}
}
