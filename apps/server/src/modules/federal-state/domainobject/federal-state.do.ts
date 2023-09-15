import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export interface ICounty {
	countyId: number;
	name: string;
	antaresKey: string;
}
export interface FederalStateProps extends AuthorizableObject {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: ICounty[];
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

	get counties(): ICounty[] | undefined {
		return this.props.counties;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
