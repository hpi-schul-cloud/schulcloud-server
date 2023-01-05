import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/external-tool/school-external-tool.do';
import { ToolSchoolController } from './tool-school.controller';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolResponseMapper } from './mapper/school-external-tool-response.mapper';
import { SchoolExternalToolParams } from './dto/request/school-external-tool.params';
import { SchoolExternalToolSearchListResponse } from './dto/response/school-external-tool-search-list.response';
import { SchoolExternalToolResponse } from './dto/response/school-external-tool.response';
import { SchoolExternalToolStatusResponse } from './dto/response/school-external-tool-status.response';

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
		const params: SchoolExternalToolParams = new SchoolExternalToolParams();
		params.schoolId = 'schoolId';

		return {
			currentUser,
			params,
		};
	};

	describe('getSchoolExternalTools is called', () => {
		describe('when endpoint is called', () => {
			it('should call the uc', async () => {
				const { currentUser, params } = setup();

				await controller.getSchoolExternalTools(currentUser, params);

				expect(schoolExternalToolUc.findSchoolExternalTools).toHaveBeenCalledWith(currentUser.userId, {
					schoolId: params.schoolId,
				});
			});

			it('should call the response mapper', async () => {
				const { currentUser, params } = setup();
				const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();
				schoolExternalToolUc.findSchoolExternalTools.mockResolvedValue([schoolExternalToolDO]);

				await controller.getSchoolExternalTools(currentUser, params);

				expect(schoolExternalToolResponseMapper.mapToSearchListResponse).toHaveBeenCalledWith([schoolExternalToolDO]);
			});

			it('should return a schoolExternalToolSearchListResponse', async () => {
				const { currentUser, params } = setup();
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

				const response = await controller.getSchoolExternalTools(currentUser, params);

				expect(response).toEqual(expectedResponse);
			});
		});
	});
});
