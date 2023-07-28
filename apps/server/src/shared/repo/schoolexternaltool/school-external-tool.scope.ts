import { Scope } from '@shared/repo/scope';
import { EntityId } from '@shared/domain';
import { SchoolExternalTool } from '@src/modules/tool/school-external-tool/entity';

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
