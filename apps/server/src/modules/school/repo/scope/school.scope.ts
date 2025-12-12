import { EntityId } from '@shared/domain/types/entity-id';
import { Scope } from '@shared/repo/scope';
import { SchoolPurpose } from '../../domain';
import { SchoolEntity } from '../school.entity';

export class SchoolScope extends Scope<SchoolEntity> {
	public byFederalState(federalStateId?: EntityId): void {
		if (federalStateId) {
			this.addQuery({ federalState: federalStateId });
		}
	}

	public byExternalId(externalId?: string): void {
		if (externalId) {
			this.addQuery({ externalId });
		}
	}

	public bySystemId(systemId?: EntityId): void {
		if (systemId) {
			this.addQuery({ systems: { $in: [systemId] } });
		}
	}

	public byPurpose(purpose?: SchoolPurpose): void {
		if (purpose) {
			this.addQuery({ purpose });
		}
	}
}
