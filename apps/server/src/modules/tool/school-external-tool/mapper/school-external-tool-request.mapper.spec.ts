import { CustomParameterEntryParam } from '../controller/dto/custom-parameter-entry.params';
import { SchoolExternalToolPostParams } from '../controller/dto/school-external-tool-post.params';
import { SchoolExternalToolDto } from '../uc/dto/school-external-tool.types';
import { SchoolExternalToolRequestMapper } from './school-external-tool-request.mapper';

describe('SchoolExternalToolRequestMapper', () => {
	const mapper: SchoolExternalToolRequestMapper = new SchoolExternalToolRequestMapper();

	describe('mapSchoolExternalToolRequest', () => {
		describe('when SchoolExternalToolPostParams is given', () => {
			const setup = () => {
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

				return {
					param,
					params,
				};
			};

			it('should return an schoolExternalTool', () => {
				const { param, params } = setup();

				const schoolExternalToolDto: SchoolExternalToolDto = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolDto>({
					toolId: params.toolId,
					parameters: [{ name: param.name, value: param.value }],
					schoolId: params.schoolId,
					toolVersion: params.version,
				});
			});
		});

		describe('when parameters are not given', () => {
			const setup = () => {
				const params: SchoolExternalToolPostParams = {
					toolId: 'toolId',
					version: 1,
					schoolId: 'schoolId',
					parameters: undefined,
				};

				return {
					params,
				};
			};

			it('should return an schoolExternalTool without parameter', () => {
				const { params } = setup();

				const schoolExternalToolDto: SchoolExternalToolDto = mapper.mapSchoolExternalToolRequest(params);

				expect(schoolExternalToolDto).toEqual<SchoolExternalToolDto>({
					toolId: params.toolId,
					parameters: [],
					schoolId: params.schoolId,
					toolVersion: params.version,
				});
			});
		});
	});
});
