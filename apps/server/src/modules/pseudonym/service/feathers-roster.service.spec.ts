import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from '@src/modules/learnroom/service';
import { ContextExternalToolService } from '@src/modules/tool/context-external-tool/service';
import { ExternalToolService } from '@src/modules/tool/external-tool/service';
import { SchoolExternalToolService } from '@src/modules/tool/school-external-tool/service';
import { UserService } from '@src/modules/user';
import { FeathersRosterService } from './feathers-roster.service';
import { PseudonymService } from './pseudonym.service';

describe('FeathersRosterService', () => {
	let module: TestingModule;
	let service: FeathersRosterService;

	let userService: DeepMocked<UserService>;
	let pseudonymService: DeepMocked<PseudonymService>;
	let courseService: DeepMocked<CourseService>;
	let externalToolService: DeepMocked<ExternalToolService>;
	let schoolExternalToolService: DeepMocked<SchoolExternalToolService>;
	let contextExternalToolService: DeepMocked<ContextExternalToolService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				FeathersRosterService,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: PseudonymService,
					useValue: createMock<PseudonymService>(),
				},
				{
					provide: CourseService,
					useValue: createMock<CourseService>(),
				},
				{
					provide: ExternalToolService,
					useValue: createMock<ExternalToolService>(),
				},
				{
					provide: SchoolExternalToolService,
					useValue: createMock<SchoolExternalToolService>(),
				},
				{
					provide: ContextExternalToolService,
					useValue: createMock<ContextExternalToolService>(),
				},
			],
		}).compile();

		service = module.get(FeathersRosterService);
		pseudonymService = module.get(PseudonymService);
		userService = module.get(UserService);
		courseService = module.get(CourseService);
		externalToolService = module.get(ExternalToolService);
		schoolExternalToolService = module.get(SchoolExternalToolService);
		contextExternalToolService = module.get(ContextExternalToolService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});
});
