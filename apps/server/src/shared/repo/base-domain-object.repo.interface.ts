import { AuthorizableObject, DomainObject } from '../domain/domain-object';

export interface BaseDomainObjectRepoInterface<D extends DomainObject<AuthorizableObject>> {
	save(domainObject: D): Promise<D>;

	saveAll(domainObjects: D[]): Promise<D[]>;

	delete(domainObjects: D[] | D): Promise<void>;
}
