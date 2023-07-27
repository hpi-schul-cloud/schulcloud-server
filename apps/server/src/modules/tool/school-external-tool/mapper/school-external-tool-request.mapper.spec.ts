import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';
import { SchoolExternalTool } from '../uc/dto/school-external-tool.types';
import { CustomParameterEntryParam, SchoolExternalToolPostParams } from '../controller/dto';

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

		describe('when parameters are not given', () => {
			it('should return an schoolExternalTool without parameter', () => {
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: undefined,
				};

				const schoolExternalTool: SchoolExternalTool = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalTool).toEqual<SchoolExternalTool>({
					toolId: params.toolId,
					parameters: [],
					schoolId: params.schoolId,
					toolVersion: params.version,
				});
			});
		});
	});
});
