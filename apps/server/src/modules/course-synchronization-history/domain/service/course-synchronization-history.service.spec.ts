import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO, CourseSynchronizationHistoryRepo } from '../../domain';
import { courseSynchronizationHistoryFactory } from '../../testing';
import { CourseSynchronizationHistoryService } from './course-synchronization-history.service';

describe(CourseSynchronizationHistoryService.name, () => {
	let module: TestingModule;
	let service: CourseSynchronizationHistoryService;
	let courseSyncHistoryRepo: DeepMocked<CourseSynchronizationHistoryRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseSynchronizationHistoryService,
				{
					provide: COURSE_SYNCHRONIZATION_HISTORY_REPO,
					useValue: createMock<CourseSynchronizationHistoryRepo>(),
				},
			],
		}).compile();

		service = module.get(CourseSynchronizationHistoryService);
		courseSyncHistoryRepo = module.get(COURSE_SYNCHRONIZATION_HISTORY_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('saveAll', () => {
		const setup = () => {
			const syncHistories = courseSynchronizationHistoryFactory.buildList(5);

			courseSyncHistoryRepo.saveAll.mockResolvedValueOnce(syncHistories);

			return { syncHistories };
		};

		it('should save the histories in the repo', async () => {
			const { syncHistories } = setup();

			await service.saveAll(syncHistories);

			expect(courseSyncHistoryRepo.saveAll).toBeCalledWith(syncHistories);
		});

		it('should return the saved histories', async () => {
			const { syncHistories } = setup();

			const result = await service.saveAll(syncHistories);

			expect(result).toEqual(syncHistories);
		});
	});

	describe('findByExternalGroupId', () => {
		describe('when the repo found a history with the external group id', () => {
			const setup = () => {
				const history = courseSynchronizationHistoryFactory.build();

				courseSyncHistoryRepo.findByExternalGroupId.mockResolvedValueOnce([history]);

				return { history };
			};

			it('should return the found history in a list', async () => {
				const { history } = setup();

				const result = await service.findByExternalGroupId(history.externalGroupId);

				expect(result).toEqual([history]);
			});
		});
	});

	describe('delete', () => {
		describe('when a list of course sync histories is passed', () => {
			it('should delete the course sync histories in the repo', async () => {
				const courseSyncHistories = courseSynchronizationHistoryFactory.buildList(3);

				await service.delete(courseSyncHistories);

				expect(courseSyncHistoryRepo.delete).toBeCalledWith(courseSyncHistories);
			});
		});

		describe('when a single course sync history is passed', () => {
			it('should delete the course sync history in the repo', async () => {
				const courseSyncHistory = courseSynchronizationHistoryFactory.build();

				await service.delete(courseSyncHistory);

				expect(courseSyncHistoryRepo.delete).toBeCalledWith(courseSyncHistory);
			});
		});
	});
});
