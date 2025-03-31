import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO, CourseSynchronizationHistoryRepo } from '../repo';
import { courseSynchronizationHistoryFactory } from '../testing';
import { CourseSynchronizationHistoryService } from './course-synchronization-history.service';

describe(CourseSynchronizationHistoryService.name, () => {
	let module: TestingModule;
	let service: CourseSynchronizationHistoryService;
	let historyRepo: DeepMocked<CourseSynchronizationHistoryRepo>;

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
		historyRepo = module.get(COURSE_SYNCHRONIZATION_HISTORY_REPO);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('save', () => {
		const setup = () => {
			const syncHistory = courseSynchronizationHistoryFactory.build();

			historyRepo.save.mockResolvedValueOnce(syncHistory);

			return { syncHistory };
		};

		it('should save the history with correct expiration date', async () => {
			const { syncHistory } = setup();

			await service.save(syncHistory);

			expect(historyRepo.save).toBeCalledWith(syncHistory);
		});

		it('should return the saved history', async () => {
			const { syncHistory } = setup();

			const result = await service.save(syncHistory);

			expect(result).toEqual(syncHistory);
		});
	});

	describe('saveAll', () => {
		const setup = () => {
			const syncHistories = courseSynchronizationHistoryFactory.buildList(5);

			historyRepo.saveAll.mockResolvedValueOnce(syncHistories);

			return { syncHistories };
		};

		it('should save the histories with correct expiration date', async () => {
			const { syncHistories } = setup();

			await service.saveAll(syncHistories);

			expect(historyRepo.saveAll).toBeCalledWith(syncHistories);
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

				historyRepo.findByExternalGroupId.mockResolvedValueOnce([history]);

				return { history };
			};

			it('should return the found history in a list', async () => {
				const { history } = setup();

				const result = await service.findByExternalGroupId(history.externalGroupId);

				expect(result).toEqual([history]);
			});
		});
	});
});
