import { SchoolExternalToolEntity } from '@modules/tool/school-external-tool/entity';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';

export class SchoolExternalToolScope extends Scope<SchoolExternalToolEntity> {
	bySchoolId(schoolId?: EntityId): this {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	byToolId(toolId?: EntityId): this {
		if (toolId !== undefined) {
			this.addQuery({ tool: toolId });
		}
		return this;
	}

	byIsDeactivated(isDeactivated?: boolean): this {
		if (isDeactivated !== undefined) {
			this.addQuery({ status: { isDeactivated } });
		}
		return this;
	}
}
