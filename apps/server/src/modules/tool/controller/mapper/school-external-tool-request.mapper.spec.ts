import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../dto';
import { SchoolExternalTool } from '../../uc/dto/school-external-tool.types';

describe('SchoolExternalToolRequestMapper', () => {
	const mapper: SchoolExternalToolRequestMapper = new SchoolExternalToolRequestMapper();

	describe('mapSchoolExternalToolRequest is called', () => {
		describe('when SchoolExternalToolPostParams is given', () => {
			it('should return an schoolExternalTool', () => {
				const param: CustomParameterEntryParam = {
					name: 'name',
					value: 'value',
				};
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: [param],
				};

				const schoolExternalTool: SchoolExternalTool = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalTool).toEqual<SchoolExternalTool>({
					toolId: params.toolId,
					parameters: [{ name: param.name, value: param.value }],
					schoolId: params.schoolId,
					toolVersion: params.version,
				});
			});
		});
	});
});
