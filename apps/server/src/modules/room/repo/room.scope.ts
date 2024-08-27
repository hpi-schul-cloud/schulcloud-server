import { MongoPatterns } from '@shared/repo';
import { Scope } from '@shared/repo/scope';
import { RoomEntity } from './entity';

export class RoomScope extends Scope<RoomEntity> {
	byName(name: string | undefined): this {
		if (name) {
			const escapedName = name.replace(MongoPatterns.REGEX_MONGO_LANGUAGE_PATTERN_WHITELIST, '').trim();
			this.addQuery({ name: new RegExp(escapedName, 'i') });
		}
		return this;
	}
}
