import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ToolSchoolController } from './tool-school.controller';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolResponseMapper } from './mapper/school-external-tool-response.mapper';
import { SchoolExternalToolSearchParams } from './dto/request/school-external-tool-search.params';
import { SchoolExternalToolSearchListResponse } from './dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from './dto/response/school-external-tool.response';
import { SchoolExternalToolStatusResponse } from './dto/response/school-external-tool-status.response';
import { SchoolExternalToolIdParams } from './dto/request/school-external-tool-id.params';

describe('ToolSchoolController', () => {
	let module: TestingModule;
	let controller: ToolSchoolController;

	let schoolExternalToolUc: DeepMocked<SchoolExternalToolUc>;
	let schoolExternalToolResponseMapper: DeepMocked<SchoolExternalToolResponseMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ToolSchoolController,
				{
					provide: SchoolExternalToolUc,
					useValue: createMock<SchoolExternalToolUc>(),
				},
				{
					provide: SchoolExternalToolResponseMapper,
					useValue: createMock<SchoolExternalToolResponseMapper>(),
				},
			],
		}).compile();

		controller = module.get(ToolSchoolController);
		schoolExternalToolUc = module.get(SchoolExternalToolUc);
		schoolExternalToolResponseMapper = module.get(SchoolExternalToolResponseMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	const setup = () => {
		const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
		const searchParams: SchoolExternalToolSearchParams = new SchoolExternalToolSearchParams();
		searchParams.schoolId = 'schoolId';

		const idParams: SchoolExternalToolIdParams = new SchoolExternalToolIdParams();
		idParams.schoolExternalToolId = 'schoolExternalToolId';

		return {
			currentUser,
			searchParams,
			idParams,
		};
	};

	describe('getSchoolExternalTools is called', () => {
		describe('when endpoint is called', () => {
			it('should call the uc', async () => {
				const { currentUser, searchParams } = setup();

				await controller.getSchoolExternalTools(currentUser, searchParams);

				expect(schoolExternalToolUc.findSchoolExternalTools).toHaveBeenCalledWith(currentUser.userId, {
					schoolId: searchParams.schoolId,
				});
			});

			it('should call the response mapper', async () => {
				const { currentUser, searchParams } = setup();
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				schoolExternalToolUc.findSchoolExternalTools.mockResolvedValue([schoolExternalToolDO]);

				await controller.getSchoolExternalTools(currentUser, searchParams);

				expect(schoolExternalToolResponseMapper.mapToSearchListResponse).toHaveBeenCalledWith([schoolExternalToolDO]);
			});

			it('should return a schoolExternalToolSearchListResponse', async () => {
				const { currentUser, searchParams } = setup();
				const expectedResponse: SchoolExternalToolSearchListResponse = new SchoolExternalToolSearchListResponse([
					new SchoolExternalToolResponse({
						name: 'name',
						schoolId: 'schoolId',
						toolId: 'toolId',
						toolVersion: 2,
						parameters: [
							{
								name: 'name',
								value: 'value',
							},
						],
						status: SchoolExternalToolStatusResponse.LATEST,
					}),
				]);

				schoolExternalToolResponseMapper.mapToSearchListResponse.mockReturnValue(expectedResponse);

				const response = await controller.getSchoolExternalTools(currentUser, searchParams);

				expect(response).toEqual(expectedResponse);
			});
		});
	});

	describe('deleteSchoolExternalTool is called', () => {
		describe('when params are given', () => {
			it('should call the uc', async () => {
				const { currentUser, idParams } = setup();

				await controller.deleteSchoolExternalTool(currentUser, idParams);

				expect(schoolExternalToolUc.deleteSchoolExternalTool).toHaveBeenCalledWith(
					currentUser.userId,
					idParams.schoolExternalToolId
				);
			});
		});
	});
});
