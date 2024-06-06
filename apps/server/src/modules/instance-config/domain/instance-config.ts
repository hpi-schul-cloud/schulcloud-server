import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface InstanceConfigProps extends AuthorizableObject {
	name: string;
}

export class InstanceConfig extends DomainObject<InstanceConfigProps> {
	public get name(): string {
		return this.props.name;
	}
}
