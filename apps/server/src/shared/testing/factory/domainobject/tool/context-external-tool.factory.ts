import { ContextExternalToolDO, CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ToolContextType } from '@src/modules/tool/interface';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from '../do-base.factory';

class ContextExternalToolDOFactory extends DoBaseFactory<ContextExternalToolDO, ContextExternalToolDO> {
	withSchoolExternalToolRef(schoolToolId: string, schoolId?: string | undefined): this {
		const params: DeepPartial<ContextExternalToolDO> = {
			schoolToolRef: { schoolToolId, schoolId },
		};
		return this.params(params);
	}
}

export const contextExternalToolDOFactory = ContextExternalToolDOFactory.define(
	ContextExternalToolDO,
	({ sequence }) => {
		return {
			schoolToolRef: { schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' },
			contextRef: { id: 'courseId', type: ToolContextType.COURSE },
			displayName: 'My Course Tool 1',
			parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
			toolVersion: 1,
		};
	}
);
