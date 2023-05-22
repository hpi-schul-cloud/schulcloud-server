import { DeepPartial } from 'fishery';
import {
	CustomParameterEntryDO,
	SchoolExternalToolDO,
	SchoolExternalToolStatus,
} from '@shared/domain/domainobject/tool';
import { DoBaseFactory } from '../do-base.factory';

class SchoolExternalToolDOFactory extends DoBaseFactory<SchoolExternalToolDO, SchoolExternalToolDO> {
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
		status: SchoolExternalToolStatus.LATEST,
	};
});
