import { DeepPartial } from 'fishery';
import { CustomParameterEntryDO } from '../../../../domain/domainobject/tool/custom-parameter-entry.do';
import { SchoolExternalToolStatus } from '../../../../domain/domainobject/tool/school-external-tool-status';
import { SchoolExternalToolDO } from '../../../../domain/domainobject/tool/school-external-tool.do';
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
