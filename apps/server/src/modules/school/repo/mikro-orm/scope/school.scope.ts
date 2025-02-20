import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';
import { SchoolEntity } from '../school.entity';

export class SchoolScope extends Scope<SchoolEntity> {
	byFederalState(federalStateId?: EntityId) {
		if (federalStateId) {
			this.addQuery({ federalState: federalStateId });
		}
	}

	byExternalId(externalId?: string) {
		if (externalId) {
			this.addQuery({ externalId });
		}
	}

	bySystemId(systemId?: EntityId) {
		if (systemId) {
			this.addQuery({ systems: { $in: [systemId] } });
		}
	}
}
