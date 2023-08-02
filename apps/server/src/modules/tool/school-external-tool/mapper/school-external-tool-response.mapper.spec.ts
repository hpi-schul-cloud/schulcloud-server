import { schoolExternalToolFactory } from '@shared/testing/factory';
import { ToolConfigurationStatusResponse } from '../../external-tool/controller/dto';
import { SchoolExternalToolResponse, SchoolExternalToolSearchListResponse } from '../controller/dto';
import { SchoolExternalTool } from '../domain';
import { SchoolExternalToolResponseMapper } from './school-external-tool-response.mapper';

describe('SchoolExternalToolResponseMapper', () => {
	let mapper: SchoolExternalToolResponseMapper;

	beforeAll(() => {
		mapper = new SchoolExternalToolResponseMapper();
	});

	describe('mapToSearchListResponse is called', () => {
		it('should return a schoolExternalToolResponse', () => {
			const response: SchoolExternalToolSearchListResponse = mapper.mapToSearchListResponse([]);

			expect(response).toBeInstanceOf(SchoolExternalToolSearchListResponse);
		});

		describe('when parameter are given', () => {
			const setup = () => {
				const do1: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				const do2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				do2.status = undefined;

				const dos: SchoolExternalTool[] = [do1, do2];

				return {
					dos,
					do1,
					do2,
				};
			};

			it('should map domain objects correctly', () => {
				const { dos, do1, do2 } = setup();

				const response: SchoolExternalToolSearchListResponse = mapper.mapToSearchListResponse(dos);

				expect(response.data).toEqual(
					expect.objectContaining<SchoolExternalToolResponse[]>([
						{
							id: do1.id as string,
							name: do1.name as string,
							schoolId: do1.schoolId,
							toolId: do1.toolId,
							toolVersion: do1.toolVersion,
							parameters: [
								{
									name: do1.parameters[0].name,
									value: do1.parameters[0].value,
								},
							],
							status: ToolConfigurationStatusResponse.LATEST,
						},
						{
							id: do2.id as string,
							name: do2.name as string,
							schoolId: do2.schoolId,
							toolId: do2.toolId,
							toolVersion: do2.toolVersion,
							parameters: [
								{
									name: do2.parameters[0].name,
									value: do2.parameters[0].value,
								},
							],
							status: ToolConfigurationStatusResponse.UNKNOWN,
						},
					])
				);
			});
		});

		describe('when optional parameter are missing', () => {
			const setup = () => {
				const do1: SchoolExternalTool = schoolExternalToolFactory.buildWithId();
				do1.id = undefined;
				do1.name = undefined;
				do1.status = undefined;

				const do2: SchoolExternalTool = schoolExternalToolFactory.buildWithId();

				const dos: SchoolExternalTool[] = [do1, do2];

				return {
					dos,
				};
			};

			it('should set defaults', () => {
				const { dos } = setup();

				const response: SchoolExternalToolSearchListResponse = mapper.mapToSearchListResponse(dos);

				expect(response.data[0]).toEqual(
					expect.objectContaining({
						id: '',
						name: '',
						status: ToolConfigurationStatusResponse.UNKNOWN,
					})
				);
			});
		});
	});
});
