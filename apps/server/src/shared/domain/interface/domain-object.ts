import type { IReferenceId } from './entity';

export abstract class BaseDomainObject implements IReferenceId {
	abstract id: string;
}
