import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';
import { SchoolExternalToolPostParams } from '../dto';
import { SchoolExternalTool } from '../../uc/dto/school-external-tool.types';

describe('SchoolExternalToolRequestMapper', () => {
	const mapper: SchoolExternalToolRequestMapper = new SchoolExternalToolRequestMapper();

	describe('mapSchoolExternalToolRequest is called', () => {
		describe('when SchoolExternalToolPostParams is given', () => {
			it('should return an schoolExternalTool', () => {
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: [
						{
							name: 'name',
							value: 'value',
						},
					],
				};

				const schoolExternalTool: SchoolExternalTool = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalTool).toEqual<SchoolExternalTool>({
					toolId: params.toolId,
					parameters: [{ name: params.parameters[0].name, value: params.parameters[0].value }],
					schoolId: params.schoolId,
					toolVersion: params.version,
				});
			});
		});
	});
});
