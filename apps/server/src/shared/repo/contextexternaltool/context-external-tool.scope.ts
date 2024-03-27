import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalToolEntity, ContextExternalToolType } from '@modules/tool/context-external-tool/entity';
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
			// TODO we should use one enum to prevent the cast and potential conflicts between the values
			const value: ContextExternalToolType = contextType as unknown as ContextExternalToolType;

			this.addQuery({ contextType: value });
		}
		return this;
	}
}
