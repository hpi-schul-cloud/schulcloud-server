import { AuthorizableObject } from '../authorizable-object';
import type { IReferenceId } from './entity';

// idea support for each CRUD action like Actions.read as abstract class, to have a generall interface

/**
 * @deprecated
 */
export abstract class BaseDomainObject implements IReferenceId, AuthorizableObject {
	abstract id: string;
}
