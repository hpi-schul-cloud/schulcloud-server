import { System } from '@shared/domain';
import { Scope } from '../scope';

export class SystemScope extends Scope<System> {
	byType(type: string): SystemScope {
		this.addQuery({ type: { $eq: type } });
		return this;
	}

	withOauthConfigOnly(only = false): SystemScope {
		if (only) {
			this.addQuery({ oauthConfig: { $ne: null } });
		}
		return this;
	}
}
