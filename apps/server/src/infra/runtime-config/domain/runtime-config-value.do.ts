import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface RuntimeConfigValueProps extends AuthorizableObject {
	key: string;
}

export class RuntimeConfigValue extends DomainObject<RuntimeConfigValueProps> {}
