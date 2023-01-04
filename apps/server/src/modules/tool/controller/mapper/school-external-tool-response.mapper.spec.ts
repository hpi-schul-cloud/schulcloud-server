import { SchoolExternalToolResponseMapper } from './school-external-tool-response.mapper';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { SchoolExternalToolSearchListResponse } from '../dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from '../dto/response/school-external-tool.response';

describe('SchoolExternalToolResponseMapper', () => {
	let mapper: SchoolExternalToolResponseMapper;

	beforeAll(() => {
		mapper = new SchoolExternalToolResponseMapper();
	});

	const setup = () => {
		const do1 = schoolExternalToolDOFactory.buildWithId();
		const do2 = schoolExternalToolDOFactory.buildWithId();

		const dos: SchoolExternalToolDO[] = [do1, do2];

		return {
			dos,
			do1,
			do2,
		};
	};

	describe('mapToSearchListResponse is called', () => {
		it('should return a schoolExternalToolResponse', () => {
			const response: SchoolExternalToolSearchListResponse = mapper.mapToSearchListResponse([]);

			expect(response).toBeInstanceOf(SchoolExternalToolSearchListResponse);
		});

		describe('when parameter are given', () => {
			it('should map domain objects correctly', () => {
				const { dos, do1, do2 } = setup();

				const response: SchoolExternalToolSearchListResponse = mapper.mapToSearchListResponse(dos);

				expect(response.data).toEqual(
					expect.objectContaining<SchoolExternalToolResponse[]>([
						{
							schoolId: do1.schoolId,
							toolId: do1.toolId,
							toolVersion: do1.toolVersion,
							parameters: [
								{
									name: do1.parameters[0].name,
									value: do1.parameters[0].value,
								},
							],
						},
						{
							schoolId: do2.schoolId,
							toolId: do2.toolId,
							toolVersion: do2.toolVersion,
							parameters: [
								{
									name: do2.parameters[0].name,
									value: do2.parameters[0].value,
								},
							],
						},
					])
				);
			});
		});
	});
});
