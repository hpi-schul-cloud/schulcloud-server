import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@shared/testing/factory/domainobject/do-base.factory';
import { DeepPartial } from 'fishery';
import { CustomParameterEntry } from '../../common/domain';
import { ToolContextType } from '../../common/enum';
import { ContextExternalTool, ContextExternalToolProps } from '../domain';

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
		schoolToolRef: { schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' },
		contextRef: { id: new ObjectId().toHexString(), type: ToolContextType.COURSE },
		displayName: 'My Course Tool 1',
		parameters: [new CustomParameterEntry({ name: 'param', value: 'value' })],
	};
});
