import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationService } from '@src/modules/authorization/';
import { schoolFactory, schoolYearFactory } from '../testing';
import { SchoolService, SchoolYearService } from '../service';
import { SchoolUc } from './school.uc';
import { SchoolDtoMapper } from '../mapper';
import { YearsDtoMapper } from '../mapper/years.dto.mapper';

describe('SchoolUc', () => {
	let service: SchoolUc;
	let authorizationService: DeepMocked<AuthorizationService>;
	let schoolService: DeepMocked<SchoolService>;
	let schoolYearService: DeepMocked<SchoolYearService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				SchoolUc,
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
				},
				{
					provide: SchoolYearService,
					useValue: createMock<SchoolYearService>(),
				},
			],
		}).compile();

		service = module.get(SchoolUc);
		authorizationService = module.get(AuthorizationService);
		schoolService = module.get(SchoolService);
		schoolYearService = module.get(SchoolYearService);
	});
	describe('getSchool', () => {
		describe('when authorization succeeds', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolService.getSchool.mockResolvedValueOnce(school);

				const schoolYears = schoolYearFactory.buildList(3);
				schoolYearService.getAllSchoolYears.mockResolvedValueOnce(schoolYears);

				authorizationService.checkPermission.mockImplementationOnce(() => {});

				const yearsDto = YearsDtoMapper.mapToDto(school, schoolYears);
				const dto = SchoolDtoMapper.mapToDto(school, yearsDto);

				return { dto };
			};

			it('should return dto', async () => {
				const { dto } = setup();

				const result = await service.getSchool('1', '2');

				expect(result).toEqual(dto);
			});
		});

		describe('when authorization fails', () => {
			const setup = () => {
				const school = schoolFactory.build();
				schoolService.getSchool.mockResolvedValueOnce(school);

				authorizationService.checkPermission.mockImplementationOnce(() => {
					throw new Error('test');
				});
			};

			it('should throw error', async () => {
				setup();

				await expect(service.getSchool('1', '2')).rejects.toThrowError('test');
			});
		});
	});

	describe('getSchoolListForExternalInvite', () => {
		const setup = () => {
			const schools = schoolFactory.buildList(3);
			schoolService.getAllSchoolsExceptOwnSchool.mockResolvedValueOnce(schools);

			const dtos = SchoolDtoMapper.mapToListForExternalInviteDtos(schools);

			return { dtos };
		};

		it('should return dtos', async () => {
			const { dtos } = setup();

			const result = await service.getSchoolListForExternalInvite({}, '1');

			expect(result).toEqual(dtos);
		});
	});
});
