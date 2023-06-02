import { DeepPartial } from 'fishery';
import { ContextExternalToolDO, CustomParameterEntryDO } from '@shared/domain/domainobject/tool';
import { ToolContextType } from '@src/modules/tool/interface';
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
			updatedAt: new Date(),
			schoolToolRef: { schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' },
			contextRef: { id: 'courseId', type: ToolContextType.COURSE },
			contextToolName: 'My Course Tool 1',
			parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
			toolVersion: 1,
			createdAt: new Date(),
		};
	}
);
