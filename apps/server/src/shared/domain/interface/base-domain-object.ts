// idea support for each CRUD action like Actions.read as abstract class, to have a generall interface

import { AuthorizableObject } from '../domain-object';

/**
 * @deprecated
 */
export abstract class BaseDomainObject implements AuthorizableObject {
	abstract id: string;
}
