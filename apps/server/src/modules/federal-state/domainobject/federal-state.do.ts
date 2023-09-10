import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
// TODO: County should have a domain object too
import { County } from '../entity';

export interface FederalStateProps extends AuthorizableObject {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: County[];
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

	get counties(): County[] | undefined {
		return this.props.counties;
	}

	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}
