import { type AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { type EntityId } from '@shared/domain/types';
import { type SchulConneXProvisioningOptions } from './schulconnex-provisionin-options.do';

export interface SchoolSystemOptionsProps<T extends AnyProvisioningOptions> extends AuthorizableObject {
	schoolId: EntityId;

	systemId: EntityId;

	provisioningOptions: T;
}

export class SchoolSystemOptions<T extends AnyProvisioningOptions = AnyProvisioningOptions> extends DomainObject<
	SchoolSystemOptionsProps<T>
> {
	get schoolId(): EntityId {
		return this.props.schoolId;
	}

	get systemId(): EntityId {
		return this.props.systemId;
	}

	get provisioningOptions(): T {
		return this.props.provisioningOptions;
	}
}

export type AnyProvisioningOptions = SchulConneXProvisioningOptions;
