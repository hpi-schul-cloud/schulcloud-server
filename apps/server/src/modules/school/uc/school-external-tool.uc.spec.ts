import { Test, TestingModule } from '@nestjs/testing';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ExternalToolDO } from '@shared/domain/domainobject/external-tool';
import { Page } from '@shared/domain/interface/page';
import { externalToolDOFactory } from '@shared/testing/factory/domainobject/external-tool.factory';
import { schoolExternalToolDOFactory } from '@shared/testing/factory/domainobject/school-external-tool.factory';
import { SchoolExternalToolUc } from './school-external-tool.uc';
import { ExternalToolService } from '../../tool/service/external-tool.service';
import { SchoolExternalToolService } from '../../tool/service/school-external-tool.service';

describe('SchoolExternalToolUc', () => {
	let module: TestingModule;
	let uc: SchoolExternalToolUc;

	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchoolExternalToolUc,
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
			],
		}).compile();

		uc = module.get(SchoolExternalToolUc);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getAvailableToolsForSchool', () => {
		describe('when getting the list of external tools that can be added to a school', () => {
			const setup = () => {
				const userId = 'userId';
				const schoolId = 'schoolId';

				return { userId, schoolId };
			};

			it('should filter tools that are already in use', async () => {
				const { userId, schoolId } = setup();
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId(undefined, 'usedToolId'),
					externalToolDOFactory.buildWithId(undefined, 'unusedToolId'),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue(
					schoolExternalToolDOFactory.buildList(1, { toolId: 'usedToolId' })
				);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool(userId, schoolId);

				expect(result).toHaveLength(1);
			});

			it('should filter tools that are hidden', async () => {
				const { userId, schoolId } = setup();
				const externalToolDOs: ExternalToolDO[] = [
					externalToolDOFactory.buildWithId({ isHidden: true }),
					externalToolDOFactory.buildWithId({ isHidden: false }),
				];

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool(userId, schoolId);

				expect(result).toHaveLength(1);
			});

			it('should return a list of available external tools', async () => {
				const { userId, schoolId } = setup();
				const externalToolDOs: ExternalToolDO[] = externalToolDOFactory.buildListWithId(2);

				externalToolService.findExternalTools.mockResolvedValue(new Page<ExternalToolDO>(externalToolDOs, 2));
				schoolExternalToolService.findSchoolExternalToolsBySchoolId.mockResolvedValue([]);

				const result: ExternalToolDO[] = await uc.getAvailableToolsForSchool(userId, schoolId);

				expect(result).toEqual(externalToolDOs);
			});
		});
	});
});
