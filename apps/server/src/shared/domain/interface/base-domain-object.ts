import { AuthorizableObject } from '../domain-object';

// idea support for each CRUD action like Actions.read as abstract class, to have a generall interface

/**
 * @deprecated
 */
export abstract class BaseDomainObject implements AuthorizableObject {
	abstract id: string;
}
