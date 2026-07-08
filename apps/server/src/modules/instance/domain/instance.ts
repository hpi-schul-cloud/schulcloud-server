import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface InstanceProps extends AuthorizableObject {
	name: string;
}

export class Instance extends DomainObject<InstanceProps> {
	get name(): string {
		return this.props.name;
	}
}
