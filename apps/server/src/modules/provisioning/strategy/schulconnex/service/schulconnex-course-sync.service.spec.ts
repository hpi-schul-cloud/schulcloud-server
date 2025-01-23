import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Group } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { CourseSyncService } from '@modules/learnroom';
import { Test, TestingModule } from '@nestjs/testing';
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
		describe('when synchronizing with a new group', () => {
			const setup = () => {
				const newGroup: Group = groupFactory.build();

				return {
					newGroup,
				};
			};

			it('should synchronize with the group', async () => {
				const { newGroup } = setup();

				await service.synchronizeCourseWithGroup(newGroup);

				expect(courseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(newGroup, undefined);
			});
		});

		describe('when synchronizing with a new group and an old group', () => {
			const setup = () => {
				const newGroup: Group = groupFactory.build();
				const oldGroup: Group = groupFactory.build();

				return {
					newGroup,
					oldGroup,
				};
			};

			it('should synchronize with the group', async () => {
				const { newGroup, oldGroup } = setup();

				await service.synchronizeCourseWithGroup(newGroup, oldGroup);

				expect(courseSyncService.synchronizeCourseWithGroup).toHaveBeenCalledWith(newGroup, oldGroup);
			});
		});
	});
});
