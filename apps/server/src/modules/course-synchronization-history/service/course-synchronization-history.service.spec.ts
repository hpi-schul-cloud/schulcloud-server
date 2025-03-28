import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CourseSynchronizationHistorySaveProps } from '../do';
import { COURSE_SYNCHRONIZATION_HISTORY_REPO, CourseSynchronizationHistoryRepo } from '../repo';
import { courseSynchronizationHistoryFactory } from '../testing';
import { CourseSynchronizationHistoryService } from './course-synchronization-history.service';

describe(CourseSynchronizationHistoryService.name, () => {
	let module: TestingModule;
	let service: CourseSynchronizationHistoryService;
	let historyRepo: DeepMocked<CourseSynchronizationHistoryRepo>;

	const expirationInSeconds = 3 * 24 * 60 * 60;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CourseSynchronizationHistoryService,
				{
					provide: COURSE_SYNCHRONIZATION_HISTORY_REPO,
					useValue: createMock<CourseSynchronizationHistoryRepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({
						getOrThrow: jest.fn().mockImplementation((key: string) => {
							if (key === 'COURSE_SYNCHRONIZATION_HISTORY_EXPIRES_IN_SECONDS') {
								return expirationInSeconds;
							}
							throw new Error('Config key not found');
						}),
					}),
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
			const now = Date.now();
			const expectedSavedHistory = courseSynchronizationHistoryFactory.build({
				expirationDate: new Date(now + expirationInSeconds * 1000),
			});

			const saveProps: CourseSynchronizationHistorySaveProps = {
				...expectedSavedHistory.getProps(),
			};

			historyRepo.save.mockResolvedValueOnce(expectedSavedHistory);

			jest.spyOn(Date, 'now').mockReturnValueOnce(now);

			return { expectedSavedHistory, saveProps };
		};

		it('should save the history with correct expiration date', async () => {
			const { expectedSavedHistory, saveProps } = setup();

			await service.save(saveProps);

			expect(historyRepo.save).toBeCalledWith(
				expect.objectContaining({
					...expectedSavedHistory.getProps(),
					id: expect.any(String),
				})
			);
		});

		it('should return the saved history', async () => {
			const { expectedSavedHistory, saveProps } = setup();

			const result = await service.save(saveProps);

			expect(result).toEqual(expectedSavedHistory);
		});
	});

	describe('findByExternalGroupId', () => {
		describe('when the repo found a history with the external group id', () => {
			const setup = () => {
				const history = courseSynchronizationHistoryFactory.build();

				historyRepo.findByExternalGroupId.mockResolvedValueOnce(history);

				return { history };
			};

			it('should return the found history', async () => {
				const { history } = setup();

				const result = await service.findByExternalGroupId(history.externalGroupId);

				expect(result).toEqual(history);
			});
		});

		describe('when the repo did not find any history', () => {
			const setup = () => {
				const externalGroupId = 'external-group-id';

				historyRepo.findByExternalGroupId.mockResolvedValueOnce(null);

				return { externalGroupId };
			};

			it('should return null', async () => {
				const { externalGroupId } = setup();

				const result = await service.findByExternalGroupId(externalGroupId);

				expect(result).toBeNull();
			});
		});
	});
});
