import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolEntity } from '@modules/tool/context-external-tool/entity';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo';

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
			// type error caused by an upgrade from micro-orm 5.7.7. to 5.7.8
			this.addQuery({ contextType });
		}
		return this;
	}
}
