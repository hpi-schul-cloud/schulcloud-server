import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

interface SystemForLdapLoginProps extends AuthorizableObject {
	id: string;
	type: string;
	alias?: string;
}

export class SystemForLdapLogin extends DomainObject<SystemForLdapLoginProps> {}
