import { SchoolEntity } from '@shared/domain/entity/school.entity';
import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';

export class SchoolScope extends Scope<SchoolEntity> {
	byFederalState(federalStateId?: EntityId) {
		if (federalStateId) {
			this.addQuery({ federalState: federalStateId });
		}
	}
}
