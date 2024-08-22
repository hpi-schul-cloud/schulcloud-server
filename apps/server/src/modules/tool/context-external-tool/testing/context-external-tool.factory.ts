import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@shared/testing/factory/domainobject/do-base.factory';
import { DeepPartial } from 'fishery';
import { CustomParameterEntry } from '../../common/domain';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalToolRef } from '../../school-external-tool/domain';
import { ContextExternalTool, ContextExternalToolProps, ContextRef } from '../domain';

class ContextExternalToolFactory extends DoBaseFactory<ContextExternalTool, ContextExternalToolProps> {
	withSchoolExternalToolRef(schoolToolId: string, schoolId?: string | undefined): this {
		const params: DeepPartial<ContextExternalTool> = {
			schoolToolRef: { schoolToolId, schoolId },
		};
		return this.params(params);
	}

	withContextRef(contextId: string, contextType: ToolContextType): this {
		const params: DeepPartial<ContextExternalTool> = {
			contextRef: { id: contextId, type: contextType },
		};
		return this.params(params);
	}
}

export const contextExternalToolFactory = ContextExternalToolFactory.define(ContextExternalTool, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		schoolToolRef: new SchoolExternalToolRef({ schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' }),
		contextRef: new ContextRef({ id: new ObjectId().toHexString(), type: ToolContextType.COURSE }),
		displayName: 'My Course Tool 1',
		parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
	};
});
