import { EntityId } from '@shared/domain/types';
import { System } from '../system.do';

export class SystemDeletedEvent {
	schoolId: EntityId;

	system: System;

	constructor(props: SystemDeletedEvent) {
		this.schoolId = props.schoolId;
		this.system = props.system;
	}
}
