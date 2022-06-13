import type { IReferenceId } from './entity';

// idea support for each CRUD action like Actions.read as abstract class, to have a generall interface

export abstract class BaseDomainObject implements IReferenceId {
	abstract id: string;
}
