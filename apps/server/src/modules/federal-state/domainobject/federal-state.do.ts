import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { CountyDO } from './county.do';

export interface FederalStateProps extends AuthorizableObject {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: CountyDO[];
	createdAt: Date;
	updatedAt: Date;
}

export class FederalStateDO extends DomainObject<FederalStateProps> {
	get name(): string {
		return this.props.name;
	}

	get abbreviation(): string {
		return this.props.abbreviation;
	}

	get logoUrl(): string {
		return this.props.logoUrl;
	}

	get counties(): CountyDO[] | undefined {
		return this.props.counties;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
