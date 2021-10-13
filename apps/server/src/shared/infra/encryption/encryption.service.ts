import * as CryptoJs from 'crypto-js';

import { Injectable } from '@nestjs/common';

@Injectable()
export class SymetricKeyEncryptionService {
	constructor(private readonly key: string) {}

	public encrypt(data: string): string {
		return CryptoJs.AES.encrypt(data, this.key).toString();
	}

	public decrypt(data: string): string {
		return CryptoJs.AES.decrypt(data, this.key).toString(CryptoJs.enc.Utf8);
	}
}
