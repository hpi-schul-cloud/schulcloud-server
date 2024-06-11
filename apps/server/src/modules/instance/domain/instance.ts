import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface InstanceProps extends AuthorizableObject {
	name: string;
}

export class Instance extends DomainObject<InstanceProps> {
	public get name(): string {
		return this.props.name;
	}
}
