import { SystemEntity } from '@shared/domain/entity/system.entity';
import { Scope } from '@shared/repo/scope';

export class SystemScope extends Scope<SystemEntity> {
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
