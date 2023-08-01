import { DeepPartial } from 'fishery';
import {
	CustomParameterEntryDO,
	SchoolExternalToolDO,
	SchoolExternalToolProps,
	ToolConfigurationStatus,
} from '@shared/domain';
import { DoBaseFactory } from '../do-base.factory';

class SchoolExternalToolDOFactory extends DoBaseFactory<SchoolExternalToolDO, SchoolExternalToolProps> {
	withSchoolId(schoolId: string): this {
		const params: DeepPartial<SchoolExternalToolDO> = {
			schoolId,
		};
		return this.params(params);
	}
}

export const schoolExternalToolDOFactory = SchoolExternalToolDOFactory.define(SchoolExternalToolDO, ({ sequence }) => {
	return {
		name: `schoolExternal-${sequence}`,
		schoolId: `schoolId-${sequence}`,
		toolVersion: 1,
		parameters: [
			new CustomParameterEntryDO({
				name: 'name',
				value: 'value',
			}),
		],
		toolId: 'toolId',
		status: ToolConfigurationStatus.LATEST,
	};
});
