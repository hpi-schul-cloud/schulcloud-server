import { DeepPartial } from 'fishery';
import { ContextExternalToolDO, CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ToolContextType } from '@src/modules/tool/context-external-tool/interface';
import { DoBaseFactory } from '../do-base.factory';

class ContextExternalToolDOFactory extends DoBaseFactory<ContextExternalToolDO, ContextExternalToolDO> {
	withSchoolToolId(schoolToolId: string): this {
		const params: DeepPartial<ContextExternalToolDO> = {
			schoolToolId,
		};
		return this.params(params);
	}
}

export const contextExternalToolDOFactory = ContextExternalToolDOFactory.define(
	ContextExternalToolDO,
	({ sequence }) => {
		return {
			schoolToolId: `schoolToolId-${sequence}`,
			contextId: 'courseId',
			contextType: ToolContextType.COURSE,
			contextToolName: 'My Course Tool 1',
			parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
			toolVersion: 1,
		};
	}
);
