import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface CountyProps extends AuthorizableObject {
	name: string;
	countyId: number;
	antaresKey: string;
	createdAt: Date;
	updatedAt: Date;
}

export class CountyDO extends DomainObject<CountyProps> {
	get name(): string {
		return this.props.name;
	}

	get countyId(): number {
		return this.props.countyId;
	}

	get antaresKey(): string {
		return this.props.antaresKey;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
