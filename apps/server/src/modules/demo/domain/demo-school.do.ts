import { EntityId } from '@shared/domain';
import { DomainObject } from '@shared/domain/domain-object'; // fix import if it is avaible

export class DemoSchool extends DomainObject<DemoSchoolProps> {
	get createdAt(): Date {
		return this.props.createdAt;
	}

	get updatedAt(): Date {
		return this.props.updatedAt;
	}
}

export interface DemoSchoolProps {
	id: EntityId;
	createdAt: Date;
	updatedAt: Date;
}
