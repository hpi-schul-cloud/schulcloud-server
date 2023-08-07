import { Scope } from '@shared/repo/scope';
import { EntityId, SchoolExternalTool } from '@shared/domain';

export class SchoolExternalToolScope extends Scope<SchoolExternalTool> {
	bySchoolId(schoolId: EntityId | undefined): this {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	byToolId(toolId: EntityId | undefined): this {
		if (toolId !== undefined) {
			this.addQuery({ tool: toolId });
		}
		return this;
	}
}
