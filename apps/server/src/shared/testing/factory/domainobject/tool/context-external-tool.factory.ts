import { ObjectId } from '@mikro-orm/mongodb';
import {
	ContextExternalToolDO,
	ContextExternalToolProps,
	CustomParameterEntryDO,
} from '@shared/domain/domainobject/tool';
import { DeepPartial } from 'fishery';
import { ToolContextType } from '@src/modules/tool/common/interface';
import { DoBaseFactory } from '../do-base.factory';

class ContextExternalToolDOFactory extends DoBaseFactory<ContextExternalToolDO, ContextExternalToolProps> {
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
			contextRef: { id: new ObjectId().toHexString(), type: ToolContextType.COURSE },
			displayName: 'My Course Tool 1',
			parameters: [new CustomParameterEntryDO({ name: 'param', value: 'value' })],
			toolVersion: 1,
		};
	}
);
