import { Scope } from '@shared/repo';
import { ContextExternalTool, EntityId } from '@shared/domain';

export class ContextExternalToolScope extends Scope<ContextExternalTool> {
	bySchoolToolId(schoolToolId: EntityId | undefined): ContextExternalToolScope {
		if (schoolToolId !== undefined) {
			this.addQuery({ schoolTool: schoolToolId });
		}
		return this;
	}

	byContextIdAndSchoolToolId(contextId: EntityId, schoolToolId: EntityId): ContextExternalToolScope {
		this.addQuery({ $and: [{ contextId }, { schoolTool: schoolToolId }] });

		return this;
	}
}
