import { AuthorizableObject, DomainObject } from '@shared/domain/domain-object';

export class County extends DomainObject<CountyProps> {}

export interface CountyProps extends AuthorizableObject {
	name: string;
	countyId: number;
	antaresKey: string;
}
