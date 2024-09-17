import { ObjectId } from '@mikro-orm/mongodb';
import { DoBaseFactory } from '@shared/testing/factory/domainobject/do-base.factory';
import { DeepPartial } from 'fishery';
import { CustomParameterEntry } from '../../common/domain';
import { ToolContextType } from '../../common/enum';
import { SchoolExternalTool, SchoolExternalToolProps } from '../domain';
import { schoolExternalToolConfigurationStatusFactory } from './school-external-tool-configuration-status.factory';

class SchoolExternalToolFactory extends DoBaseFactory<SchoolExternalTool, SchoolExternalToolProps> {
	withSchoolId(schoolId: string): this {
		const params: DeepPartial<SchoolExternalTool> = {
			schoolId,
		};
		return this.params(params);
	}
}

export const schoolExternalToolFactory = SchoolExternalToolFactory.define(SchoolExternalTool, ({ sequence }) => {
	return {
		id: new ObjectId().toHexString(),
		name: `schoolExternal-${sequence}`,
		schoolId: `schoolId-${sequence}`,
		parameters: [
			new CustomParameterEntry({
				name: 'name',
				value: 'value',
			}),
		],
		toolId: 'toolId',
		isDeactivated: false,
		status: schoolExternalToolConfigurationStatusFactory.build(),
		availableContexts: [ToolContextType.COURSE, ToolContextType.BOARD_ELEMENT, ToolContextType.MEDIA_BOARD],
	};
});
