import { DeepPartial } from 'fishery';
import { DoBaseFactory } from './do-base.factory';
import { SchoolExternalToolDO } from '../../../domain/domainobject/external-tool/school-external-tool.do';

class SchoolExternalToolDOFactory extends DoBaseFactory<SchoolExternalToolDO, SchoolExternalToolDO> {
	withSchoolId(schoolId: string): this {
		const params: DeepPartial<SchoolExternalToolDO> = {
			schoolId,
		};
		return this.params(params);
	}
}

export const schoolExternalToolDOFactory = SchoolExternalToolDOFactory.define(SchoolExternalToolDO, () => {
	return {
		schoolId: 'schoolId',
		toolVersion: 1,
		parameters: [{ name: 'name', value: 'value' }],
		toolId: 'toolId',
	};
});
