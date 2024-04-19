import { ObjectId } from '@mikro-orm/mongodb';
import { CustomParameterEntry } from '@modules/tool/common/domain';
import { ToolContextType } from '@modules/tool/common/enum';
import { ContextExternalTool, ContextExternalToolProps } from '@modules/tool/context-external-tool/domain';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from '../do-base.factory';

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
		schoolToolRef: { schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' },
		contextRef: { id: new ObjectId().toHexString(), type: ToolContextType.COURSE },
		displayName: 'My Course Tool 1',
		parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
		toolVersion: 1,
	};
});
