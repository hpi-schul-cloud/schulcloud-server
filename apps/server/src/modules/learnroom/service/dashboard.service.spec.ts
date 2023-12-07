import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { IDashboardRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { DashboardService } from '.';

describe(DashboardService.name, () => {
	let module: TestingModule;
	let userRepo: DeepMocked<UserRepo>;
	let repo: IDashboardRepo;
	let dashboardService: DeepMocked<DashboardService>;

	beforeAll(async () => {
		await setupEntities();
		module = await Test.createTestingModule({
			providers: [
				DashboardService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: 'DASHBOARD_REPO',
					useValue: createMock<DashboardService>(),
				},
			],
		}).compile();
		dashboardService = module.get(DashboardService);
		userRepo = module.get(UserRepo);
		repo = module.get('DASHBOARD_REPO');
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('when deleting by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			userRepo.findById.mockResolvedValue(user);

			return { user };
		};

		it('should call dashboardRepo.deleteDashboardByUserId', async () => {
			const { user } = setup();
			const spy = jest.spyOn(repo, 'deleteDashboardByUserId');

			await dashboardService.deleteDashboardByUserId(user.id);

			expect(spy).toHaveBeenCalledWith(user.id);
		});

		it('should delete users dashboard', async () => {
			const { user } = setup();
			jest.spyOn(repo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

			const result = await dashboardService.deleteDashboardByUserId(user.id);

			expect(result).toEqual(1);
		});
	});
});
