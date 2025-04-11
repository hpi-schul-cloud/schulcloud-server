import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Course, CourseSyncService } from '@modules/course';
import { courseFactory } from '@modules/course/testing';
import {
	CourseSynchronizationHistory,
	CourseSynchronizationHistoryProps,
	CourseSynchronizationHistoryService,
} from '@modules/course-synchronization-history';
import { courseSynchronizationHistoryFactory } from '@modules/course-synchronization-history/testing';
import { Group } from '@modules/group';
import { groupFactory } from '@modules/group/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ExternalSource } from '@shared/domain/domainobject';
import { CourseSyncHistoryGroupExternalSourceMissingLoggableException } from '../../../loggable';
import { SchulconnexCourseSyncService } from './schulconnex-course-sync.service';

describe(SchulconnexCourseSyncService.name, () => {
	let module: TestingModule;
	let service: SchulconnexCourseSyncService;
	let courseSyncService: DeepMocked<CourseSyncService>;
	let courseSyncHistoryService: DeepMocked<CourseSynchronizationHistoryService>;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SchulconnexCourseSyncService,
				{
					provide: CourseSyncService,
					useValue: createMock<CourseSyncService>(),
				},
				{
					provide: CourseSynchronizationHistoryService,
					useValue: createMock<CourseSynchronizationHistoryService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		service = module.get(SchulconnexCourseSyncService);
		courseSyncService = module.get(CourseSyncService);
		courseSyncHistoryService = module.get(CourseSynchronizationHistoryService);
		configService = module.get(ConfigService);
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

	describe('synchronizeCoursesFromHistory', () => {
		describe('when the group has no external source', () => {
			it('should not do any synchronization', async () => {
				const group = groupFactory.build({ externalSource: undefined });

				await service.synchronizeCoursesFromHistory(group);

				expect(courseSyncHistoryService.findByExternalGroupId).not.toBeCalled();
				expect(courseSyncService.synchronizeCoursesFromHistory).not.toBeCalled();
				expect(courseSyncHistoryService.delete).not.toBeCalled();
			});
		});

		describe('when there are no sync histories for the courses', () => {
			it('should not do any synchronization', async () => {
				const group = groupFactory.build();
				courseSyncHistoryService.findByExternalGroupId.mockResolvedValueOnce([]);

				await service.synchronizeCoursesFromHistory(group);

				expect(courseSyncService.synchronizeCoursesFromHistory).not.toBeCalled();
				expect(courseSyncHistoryService.delete).not.toBeCalled();
			});
		});

		describe('when there are sync histories for the courses', () => {
			const setup = () => {
				const externalGroupId = 'external-group-id';

				const group = groupFactory.build({
					externalSource: new ExternalSource({
						externalId: externalGroupId,
						systemId: new ObjectId().toHexString(),
						lastSyncedAt: new Date(),
					}),
				});

				const courseSyncHistories = courseSynchronizationHistoryFactory.buildList(3, {
					externalGroupId,
				});

				courseSyncHistoryService.findByExternalGroupId.mockResolvedValueOnce(courseSyncHistories);

				return { group, courseSyncHistories };
			};

			it('should sync the courses from the histories', async () => {
				const { group, courseSyncHistories } = setup();

				await service.synchronizeCoursesFromHistory(group);

				expect(courseSyncService.synchronizeCoursesFromHistory).toBeCalledWith(group, courseSyncHistories);
			});

			it('should remove the course sync histories of the courses', async () => {
				const { group, courseSyncHistories } = setup();

				await service.synchronizeCoursesFromHistory(group);

				expect(courseSyncHistoryService.delete).toBeCalledWith(courseSyncHistories);
			});
		});
	});

	describe('desyncCoursesAndCreateHistories', () => {
		describe('when the group has no external source', () => {
			const setup = () => {
				const group = groupFactory.build({
					externalSource: undefined,
				});

				const courses = courseFactory.buildList(3, { syncedWithGroup: group.id });

				return {
					group,
					courses,
				};
			};

			it('should throw an CourseSyncHistoryGroupExternalSourceMissingLoggableException', async () => {
				const { group, courses } = setup();

				const promise = service.desyncCoursesAndCreateHistories(group, courses);

				await expect(promise).rejects.toThrow(
					new CourseSyncHistoryGroupExternalSourceMissingLoggableException(group.id)
				);
			});
		});

		describe('when the group has an external source', () => {
			const setup = () => {
				const externalGroupId = 'external-group-id';

				const group = groupFactory.build({
					externalSource: new ExternalSource({
						systemId: new ObjectId().toHexString(),
						externalId: externalGroupId,
						lastSyncedAt: new Date(),
					}),
				});

				const courses = courseFactory.buildList(3, { syncedWithGroup: group.id });

				const mockExpirationSeconds = 5 * 24 * 60 * 60;
				const mockDate = new Date();

				configService.getOrThrow.mockReturnValueOnce(mockExpirationSeconds);
				jest.spyOn(Date, 'now').mockReturnValueOnce(mockDate.getTime());

				return {
					group,
					courses,
					mockExpirationSeconds,
					mockDate,
				};
			};

			it('should create a course sync history for each synced course', async () => {
				const { group, courses, mockExpirationSeconds, mockDate } = setup();

				await service.desyncCoursesAndCreateHistories(group, courses);

				expect(courseSyncHistoryService.saveAll).toBeCalled();

				const savedHistoriesArg: CourseSynchronizationHistory[] = courseSyncHistoryService.saveAll.mock.calls[0][0];
				expect(savedHistoriesArg.length).toEqual(courses.length);

				savedHistoriesArg.forEach((savedHistory: CourseSynchronizationHistory) => {
					const course = courses.find((course: Course) => course.id === savedHistory.synchronizedCourse);

					expect(course).toBeDefined();
					expect(savedHistory.getProps()).toEqual<CourseSynchronizationHistoryProps>({
						id: expect.any(String),
						externalGroupId: group.externalSource?.externalId as string,
						synchronizedCourse: course?.id as string,
						expiresAt: new Date(mockDate.getTime() + mockExpirationSeconds * 1000),
						excludeFromSync: course?.excludeFromSync,
					});
				});
			});

			it('should desynchronize the courses from the group', async () => {
				const { group, courses } = setup();

				await service.desyncCoursesAndCreateHistories(group, courses);

				expect(courseSyncService.stopSynchronizations).toBeCalledWith(courses);
			});
		});
	});
});
