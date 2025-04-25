import KeyvValkey from '@keyv/valkey';
import Redis from 'ioredis';

export class KeyvValkeyAdapter extends KeyvValkey {
	public async keys(pattern: string): Promise<string[]> {
		const keyName = this._getKeyName(pattern);
		const keys = await (this.redis as Redis).keys(keyName);

		return keys;
	}
}
