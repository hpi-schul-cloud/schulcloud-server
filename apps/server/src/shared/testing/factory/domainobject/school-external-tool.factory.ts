import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { DoBaseFactory } from './do-base.factory';
import { CustomParameterEntryDO } from '../../../domain/domainobject/external-tool/custom-parameter-entry.do';

export const schoolExternalToolDOFactory = DoBaseFactory.define<SchoolExternalToolDO, SchoolExternalToolDO>(
	SchoolExternalToolDO,
	({ sequence }) => {
		return {
			id: `schoolExternalToolId-${sequence}`,
			toolId: 'toolId',
			schoolId: 'schoolId',
			parameters: [
				new CustomParameterEntryDO({
					name: 'parameterName',
					value: 'parameterValue',
				}),
			],
			toolVersion: 1,
		};
	}
);
