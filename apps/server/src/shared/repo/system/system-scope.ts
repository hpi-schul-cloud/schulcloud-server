import { System } from '@shared/domain';
import { Scope } from '../scope';

export class SystemScope extends Scope<System> {
	withLdapConfig(): SystemScope {
		this.addQuery({ ldapConfig: { $ne: null } });
		return this;
	}

	withOauthConfig(): SystemScope {
		this.addQuery({ oauthConfig: { $ne: null } });
		return this;
	}

	withOidcConfig(): SystemScope {
		this.addQuery({ oidcConfig: { $ne: null } });
		return this;
	}
}
