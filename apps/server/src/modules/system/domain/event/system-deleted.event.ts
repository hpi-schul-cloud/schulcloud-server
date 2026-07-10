import { type EntityId } from '@shared/domain/types';
import { type System } from '../do/system.do';

export class SystemDeletedEvent {
	public schoolId: EntityId;

	public system: System;

	constructor(props: SystemDeletedEvent) {
		this.schoolId = props.schoolId;
		this.system = props.system;
	}
}
