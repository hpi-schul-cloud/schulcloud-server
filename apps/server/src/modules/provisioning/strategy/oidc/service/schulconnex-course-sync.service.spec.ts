import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Group } from '@modules/group';
import { CourseSyncService } from '@modules/learnroom';
import { Test, TestingModule } from '@nestjs/testing';
import { groupFactory } from '@shared/testing';
import { SchulconnexCourseSyncService } from './schulconnex-course-sync.service';

describe(SchulconnexCourseSyncService.name, () => {
	let module: TestingModule;
	let service: SchulconnexCourseSyncService;
	let courseSyncService: DeepMocked<CourseSyncService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexCourseSyncService,
				{
					provide: CourseSyncService,
					useValue: createMock<CourseSyncService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexCourseSyncService);
		courseSyncService = module.get(CourseSyncService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('synchronizeCourseWithGroup', () => {
		describe('when synchronizing with a group', () => {
			const setup = () => {
				const group: Group = groupFactory.build();

				return {
					group,
				};
			};

			it('should synchronize with the group', async () => {
				const { group } = setup();

				await service.synchronizeCourseWithGroup(group);

				expect(courseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(group);
			});
		});
	});
});
