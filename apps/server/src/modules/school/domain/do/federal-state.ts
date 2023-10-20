import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';
import { County } from '../type';

export class FederalState extends DomainObject<FederalStateProps> {}

export interface FederalStateProps extends AuthorizableObject {
	name: string;
	abbreviation: string;
	logoUrl: string;
	counties?: County[];
	createdAt: Date;
	updatedAt: Date;
}
