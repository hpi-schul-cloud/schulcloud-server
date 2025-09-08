import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { County } from './county';

export class FederalState extends DomainObject<FederalStateProps> {
	get abbreviation(): string {
		return this.props.abbreviation;
	}
}

export interface FederalStateProps extends AuthorizableObject {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: County[];
}
