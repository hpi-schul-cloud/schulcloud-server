import { FilterQuery, ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { Scope } from '@shared/repo/scope';
import { ToolContextType } from '../../../common/enum';
import { ContextExternalToolEntity } from './context-external-tool.entity';

export class ContextExternalToolScope extends Scope<ContextExternalToolEntity> {
	public byId(id: EntityId | undefined): ContextExternalToolScope {
		if (id !== undefined) {
			this.addQuery({ id });
		}

		return this;
	}

	public bySchoolToolId(schoolToolId: EntityId | undefined): ContextExternalToolScope {
		if (schoolToolId !== undefined) {
			this.addQuery({ schoolTool: schoolToolId });
		}
		return this;
	}

	public byContextId(contextId: EntityId | undefined): ContextExternalToolScope {
		if (contextId !== undefined) {
			this.addQuery({ contextId: new ObjectId(contextId) });
		}

		return this;
	}

	public byContextType(contextType: ToolContextType | undefined): ContextExternalToolScope {
		if (contextType !== undefined) {
			this.addQuery({ contextType: contextType as unknown as ContextExternalToolEntity['contextType'] });
		}
		return this;
	}
}
