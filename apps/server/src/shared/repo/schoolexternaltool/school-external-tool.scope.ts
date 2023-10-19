import { Scope } from '@shared/repo/scope';
import { EntityId } from '@shared/domain';
import { SchoolExternalToolEntity } from '@src/modules/tool/school-external-tool/entity';

export class SchoolExternalToolScope extends Scope<SchoolExternalToolEntity> {
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
