import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { schoolFactory } from '../../testing';
import { SchoolAuthorizableService } from './school-authorizable.service';
import { SchoolService } from './school.service';
import { AuthorizationInjectionService, AuthorizableReferenceType } from '@modules/authorization';

describe(SchoolAuthorizableService.name, () => {
	let module: TestingModule;
	let service: SchoolAuthorizableService;

	let schoolService: DeepMocked<SchoolService>;
	let injectionService: AuthorizationInjectionService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AuthorizationInjectionService,
				SchoolAuthorizableService,
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
			],
		}).compile();

		service = module.get(SchoolAuthorizableService);
		schoolService = module.get(SchoolService);
		injectionService = module.get(AuthorizationInjectionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('constructor', () => {
		it('should inject itself into the AuthorizationInjectionService', () => {
			expect(injectionService.getReferenceLoader(AuthorizableReferenceType.School)).toBe(service);
		});
	});

	describe('findById', () => {
		describe('when id is given', () => {
			const setup = () => {
				const school = schoolFactory.build();

				schoolService.getSchoolById.mockResolvedValue(school);

				return {
					school,
				};
			};

			it('should return a school', async () => {
				const { school } = setup();

				const result = await service.findById(school.id);

				expect(result).toEqual(school);
			});
		});
	});
});
