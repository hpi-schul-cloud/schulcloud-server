import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@src/modules/authentication';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/tool/school-external-tool.factory';
import { SchoolExternalToolDO } from '@shared/domain/domainobject/tool/school-external-tool.do';
import { LegacyLogger } from '@src/core/logger';
import { ToolSchoolController } from './tool-school.controller';
import { SchoolExternalToolUc } from '../uc';
import { SchoolExternalToolResponseMapper, SchoolExternalToolRequestMapper } from './mapper';
import {
	SchoolExternalToolIdParams,
	SchoolExternalToolPostParams,
	SchoolExternalToolResponse,
	SchoolExternalToolSearchListResponse,
	SchoolExternalToolSearchParams,
	SchoolExternalToolStatusResponse,
} from './dto';

describe('ToolSchoolController', () => {
	let module: TestingModule;
	let controller: ToolSchoolController;

	let schoolExternalToolUc: DeepMocked<SchoolExternalToolUc>;
	let schoolExternalToolResponseMapper: DeepMocked<SchoolExternalToolResponseMapper>;
	let schoolExternalToolRequestMapper: DeepMocked<SchoolExternalToolRequestMapper>;

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
				{
					provide: SchoolExternalToolRequestMapper,
					useValue: createMock<SchoolExternalToolRequestMapper>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		controller = module.get(ToolSchoolController);
		schoolExternalToolUc = module.get(SchoolExternalToolUc);
		schoolExternalToolResponseMapper = module.get(SchoolExternalToolResponseMapper);
		schoolExternalToolRequestMapper = module.get(SchoolExternalToolRequestMapper);
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

		const createParams: SchoolExternalToolPostParams = {
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

		const schoolExternalToolDO: SchoolExternalToolDO = schoolExternalToolDOFactory.buildWithId();

		return {
			currentUser,
			searchParams,
			idParams,
			createParams,
			schoolExternalToolDO,
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
						id: 'id',
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

	describe('createSchoolExternalTool is called', () => {
		describe('when params are given', () => {
			it('should call the schoolExternalToolRequestMapper', async () => {
				const { currentUser, createParams } = setup();

				await controller.createSchoolExternalTool(currentUser, createParams);

				expect(schoolExternalToolRequestMapper.mapSchoolExternalToolRequest).toHaveBeenCalledWith(createParams);
			});

			it('should call the uc', async () => {
				const { currentUser, createParams, schoolExternalToolDO } = setup();
				schoolExternalToolRequestMapper.mapSchoolExternalToolRequest.mockReturnValue(schoolExternalToolDO);

				await controller.createSchoolExternalTool(currentUser, createParams);

				expect(schoolExternalToolUc.createSchoolExternalTool).toHaveBeenCalledWith(
					currentUser.userId,
					schoolExternalToolDO
				);
			});

			it('should call the schoolExternalToolRequestMapper', async () => {
				const { currentUser, createParams, schoolExternalToolDO } = setup();
				schoolExternalToolUc.createSchoolExternalTool.mockResolvedValue(schoolExternalToolDO);

				await controller.createSchoolExternalTool(currentUser, createParams);

				expect(schoolExternalToolResponseMapper.mapToSchoolExternalToolResponse).toHaveBeenCalledWith(
					schoolExternalToolDO
				);
			});

			it('should return a schoolExternalToolResponse', async () => {
				const { currentUser, createParams, schoolExternalToolDO } = setup();
				schoolExternalToolRequestMapper.mapSchoolExternalToolRequest.mockReturnValue(schoolExternalToolDO);
				schoolExternalToolUc.createSchoolExternalTool.mockResolvedValue(schoolExternalToolDO);
				schoolExternalToolResponseMapper.mapToSchoolExternalToolResponse.mockReturnValue({
					name: 'name',
					parameters: [],
					schoolId: 'schoolId',
					status: SchoolExternalToolStatusResponse.LATEST,
					toolId: 'toolId',
					toolVersion: 0,
					id: 'id',
				});

				const schoolExternalToolResponse = await controller.createSchoolExternalTool(currentUser, createParams);

				expect(schoolExternalToolResponse).toBeDefined();
			});
		});
	});
});
