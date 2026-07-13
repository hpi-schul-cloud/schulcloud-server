import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type SystemForLdapLogin } from './system-for-ldap-login';

export interface SchoolForLdapLoginProps extends AuthorizableObject {
	id: string;
	name: string;
	systems: SystemForLdapLogin[];
}

export class SchoolForLdapLogin extends DomainObject<SchoolForLdapLoginProps> {}
