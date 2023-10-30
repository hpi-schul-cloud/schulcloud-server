import { CustomParameterEntry } from '@src/modules/tool/common/domain/custom-parameter-entry.do';
import { ToolConfigurationStatus } from '@src/modules/tool/common/enum/tool-configuration-status';
import {
	SchoolExternalTool,
	SchoolExternalToolProps,
} from '@src/modules/tool/school-external-tool/domain/school-external-tool.do';
import { DeepPartial } from 'fishery';
import { DoBaseFactory } from '../do-base.factory';

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
		name: `schoolExternal-${sequence}`,
		schoolId: `schoolId-${sequence}`,
		toolVersion: 1,
		parameters: [
			new CustomParameterEntry({
				name: 'name',
				value: 'value',
			}),
		],
		toolId: 'toolId',
		status: ToolConfigurationStatus.LATEST,
	};
});
