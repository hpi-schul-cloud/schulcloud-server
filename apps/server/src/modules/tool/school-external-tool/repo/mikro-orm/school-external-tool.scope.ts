import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { SchoolExternalToolEntity } from './school-external-tool.entity';

export class SchoolExternalToolScope extends Scope<SchoolExternalToolEntity> {
	public bySchoolId(schoolId?: EntityId): this {
		if (schoolId !== undefined) {
			this.addQuery({ school: schoolId });
		}
		return this;
	}

	public byToolId(toolId?: EntityId): this {
		if (toolId !== undefined) {
			this.addQuery({ tool: toolId });
		}
		return this;
	}

	public byIsDeactivated(isDeactivated?: boolean): this {
		if (isDeactivated !== undefined) {
			this.addQuery({ isDeactivated });
		}
		return this;
	}
}
