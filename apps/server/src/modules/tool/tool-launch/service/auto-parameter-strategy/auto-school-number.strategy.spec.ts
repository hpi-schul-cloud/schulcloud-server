import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { LegacySchoolService } from '@modules/legacy-school';
import { Test, TestingModule } from '@nestjs/testing';
import { LegacySchoolDo } from '@shared/domain/domainobject';
import { contextExternalToolFactory, legacySchoolDoFactory, schoolExternalToolFactory } from '@shared/testing/factory';
import { ContextExternalTool } from '../../../context-external-tool/domain';
import { SchoolExternalTool } from '../../../school-external-tool/domain';
import { AutoSchoolNumberStrategy } from './auto-school-number.strategy';

describe(AutoSchoolNumberStrategy.name, () => {
	let module: TestingModule;
	let strategy: AutoSchoolNumberStrategy;

	let schoolService: DeepMocked<LegacySchoolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AutoSchoolNumberStrategy,
				{
					provide: LegacySchoolService,
					useValue: createMock<LegacySchoolService>(),
				},
			],
		}).compile();

		strategy = module.get(AutoSchoolNumberStrategy);
		schoolService = module.get(LegacySchoolService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('getValue', () => {
		describe('when the school has a school number', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					officialSchoolNumber: 'officialSchoolNumber',
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId: school.id as string,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id as string,
						schoolId: school.id,
					},
				});

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					school,
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return the school number', async () => {
				const { school, schoolExternalTool, contextExternalTool } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toEqual(school.officialSchoolNumber);
			});
		});

		describe('when the school does not have a school number', () => {
			const setup = () => {
				const school: LegacySchoolDo = legacySchoolDoFactory.buildWithId({
					officialSchoolNumber: undefined,
				});

				const schoolExternalTool: SchoolExternalTool = schoolExternalToolFactory.buildWithId({
					schoolId: school.id as string,
				});
				const contextExternalTool: ContextExternalTool = contextExternalToolFactory.buildWithId({
					schoolToolRef: {
						schoolToolId: schoolExternalTool.id as string,
						schoolId: school.id,
					},
				});

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					schoolExternalTool,
					contextExternalTool,
				};
			};

			it('should return undefined', async () => {
				const { schoolExternalTool, contextExternalTool } = setup();

				const result: string | undefined = await strategy.getValue(schoolExternalTool, contextExternalTool);

				expect(result).toBeUndefined();
			});
		});
	});
});
