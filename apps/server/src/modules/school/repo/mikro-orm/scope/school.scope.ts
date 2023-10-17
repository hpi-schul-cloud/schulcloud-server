import { EntityId, SchoolEntity } from '@shared/domain';
import { Scope } from '@shared/repo';

export class SchoolScope extends Scope<SchoolEntity> {
	byFederalState(federalStateId?: EntityId) {
		if (federalStateId) {
			this.addQuery({ federalState: federalStateId });
		}
	}
}
