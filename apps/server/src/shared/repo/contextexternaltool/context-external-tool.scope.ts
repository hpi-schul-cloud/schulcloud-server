import { Scope } from '@shared/repo';
import { EntityId } from '@shared/domain';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';

export class ContextExternalToolScope extends Scope<ContextExternalToolEntity> {
	byId(id: EntityId | undefined): ContextExternalToolScope {
		if (id !== undefined) {
			this.addQuery({ id });
		}

		return this;
	}

	bySchoolToolId(schoolToolId: EntityId | undefined): ContextExternalToolScope {
		if (schoolToolId !== undefined) {
			this.addQuery({ schoolTool: schoolToolId });
		}
		return this;
	}

	byContextId(contextId: EntityId | undefined): ContextExternalToolScope {
		if (contextId !== undefined) {
			this.addQuery({ contextId });
		}

		return this;
	}

	byContextType(contextType: ToolContextType | undefined): ContextExternalToolScope {
		if (contextType !== undefined) {
			this.addQuery({ contextType });
		}
		return this;
	}
}
