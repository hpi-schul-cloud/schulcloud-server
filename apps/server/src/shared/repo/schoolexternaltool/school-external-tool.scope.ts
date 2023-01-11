import { Scope } from '@shared/repo';
import { EntityId, SchoolExternalTool } from '@shared/domain';

export class SchoolExternalToolScope extends Scope<SchoolExternalTool> {
	bySchoolId(schoolId: EntityId | undefined): SchoolExternalToolScope {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}
}
