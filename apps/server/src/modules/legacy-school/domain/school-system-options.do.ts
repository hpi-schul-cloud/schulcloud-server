import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { EntityId } from '@shared/domain/types';
import { SchulConneXProvisioningOptions } from './schulconnex-provisionin-options.do';

export interface SchoolSystemOptionsProps<T extends AnyProvisioningOptions> extends AuthorizableObject {
	schoolId: EntityId;

	systemId: EntityId;

	provisioningOptions: T;
}

export class SchoolSystemOptions<T extends AnyProvisioningOptions = AnyProvisioningOptions> extends DomainObject<
	SchoolSystemOptionsProps<T>
> {
	public get schoolId(): EntityId {
		return this.props.schoolId;
	}

	public get systemId(): EntityId {
		return this.props.systemId;
	}

	public get provisioningOptions(): T {
		return this.props.provisioningOptions;
	}

	/* TODO public getPossibleStrategies(): SystemProvisioningStrategy[] {
		const strategies: SystemProvisioningStrategy[] = [];

		provisioningStrategyOptions.forEach((value: new () => AnyProvisioningOptions, key: SystemProvisioningStrategy) => {
			if (this.props.provisioningOptions instanceof value) {
				strategies.push(key);
			}
		});

		return strategies;
	} */
}

export type AnyProvisioningOptions = SchulConneXProvisioningOptions;
