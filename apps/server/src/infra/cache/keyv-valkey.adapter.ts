import KeyvValkey from '@keyv/valkey';
import Redis from 'iovalkey';

export class KeyvValkeyAdapter extends KeyvValkey {
	public async keys(pattern: string): Promise<string[]> {
		let keys: string[] = [];

		if ('keys' in this.redis) {
			const keyName = this._getKeyName(pattern);
			keys = await (this.redis as Redis).keys(keyName);
		}

		return keys;
	}
}
