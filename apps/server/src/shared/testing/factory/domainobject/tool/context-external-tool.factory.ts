import { DeepPartial } from 'fishery';
import {
	ContextExternalToolDO,
	CustomParameterEntryDO,
	SchoolExternalToolRefDO,
} from '@shared/domain/domainobject/tool';
import { ToolContextType } from '@src/modules/tool/interface';
import { DoBaseFactory } from '../do-base.factory';

class ContextExternalToolDOFactory extends DoBaseFactory<ContextExternalToolDO, ContextExternalToolDO> {
	withSchoolExternalToolRef(schoolToolId: string, schoolId: string): this {
		const params: DeepPartial<ContextExternalToolDO> = {
			schoolToolRef: new SchoolExternalToolRefDO({ schoolToolId, schoolId }),
		};
		return this.params(params);
	}
}

export const contextExternalToolDOFactory = ContextExternalToolDOFactory.define(
	ContextExternalToolDO,
	({ sequence }) => {
		return {
			schoolToolRef: new SchoolExternalToolRefDO({ schoolToolId: `schoolToolId-${sequence}`, schoolId: 'schoolId' }),
			contextId: 'courseId',
			contextType: ToolContextType.COURSE,
			contextToolName: 'My Course Tool 1',
			parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
			toolVersion: 1,
		};
	}
);
