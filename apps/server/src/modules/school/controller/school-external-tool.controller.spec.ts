import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@shared/domain';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { SchoolExternalToolController } from './school-external-tool.controller';
import { SchoolExternalToolUc } from '../uc/school-external-tool.uc';
import { SchoolExternalToolMapper } from './mapper/school-external-tool.mapper';
import { SchoolExternalToolListResponse, SchoolExternalToolResponse, SchoolParams } from './dto';

describe('SchoolExternalToolController', () => {
	let module: TestingModule;
	let controller: SchoolExternalToolController;

	let schoolExternalToolUc: DeepMocked<SchoolExternalToolUc>;
	let schoolExternalToolMapper: DeepMocked<SchoolExternalToolMapper>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolController,
				{
					provide: SchoolExternalToolUc,
					useValue: createMock<SchoolExternalToolUc>(),
				},
				{
					provide: SchoolExternalToolMapper,
					useValue: createMock<SchoolExternalToolMapper>(),
				},
			],
		}).compile();

		controller = module.get(SchoolExternalToolController);
		schoolExternalToolUc = module.get(SchoolExternalToolUc);
		schoolExternalToolMapper = module.get(SchoolExternalToolMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool', () => {
		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const currentUser: ICurrentUser = { userId: 'userId' } as ICurrentUser;
				const schoolParams: SchoolParams = new SchoolParams();
				schoolParams.schoolId = 'schoolId';
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);
				const response: SchoolExternalToolListResponse = new SchoolExternalToolListResponse([
					new SchoolExternalToolResponse({
						id: 'toolId',
						name: 'toolName',
						logoUrl: 'logoUrl',
					}),
				]);

				schoolExternalToolUc.getAvailableToolsForSchool.mockResolvedValue(externalToolDOs);
				schoolExternalToolMapper.mapExternalToolDOsToSchoolExternalToolListResponse.mockReturnValue(response);

				return {
					currentUser,
					schoolParams,
					response,
					externalToolDOs,
				};
			};

			it('should call schoolExternalToolUc.getAvailableToolsForSchool', async () => {
				const { currentUser, schoolParams } = setup();

				await controller.getAvailableToolsForSchool(currentUser, schoolParams);

				expect(schoolExternalToolUc.getAvailableToolsForSchool).toHaveBeenCalledWith(
					currentUser.userId,
					schoolParams.schoolId
				);
			});

			it('should return a list of available external tools', async () => {
				const { currentUser, schoolParams, response } = setup();

				const result: SchoolExternalToolListResponse = await controller.getAvailableToolsForSchool(
					currentUser,
					schoolParams
				);

				expect(result).toEqual(response);
			});
		});
	});
});
