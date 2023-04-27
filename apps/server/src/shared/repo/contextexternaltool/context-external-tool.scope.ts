import { Scope } from '@shared/repo';
import { ContextExternalTool, EntityId } from '@shared/domain';

export class ContextExternalToolScope extends Scope<ContextExternalTool> {
	bySchoolToolId(schoolToolId: EntityId | undefined): ContextExternalToolScope {
		if (schoolToolId !== undefined) {
			this.addQuery({ schoolTool: schoolToolId });
		}
		return this;
	}
}
