import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardElementRepo, IDashboardRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { DashboardService } from '.';

describe(DashboardService.name, () => {
	let module: TestingModule;
	let userRepo: DeepMocked<UserRepo>;
	let dashboardRepo: IDashboardRepo;
	let dashboardElementRepo: DeepMocked<DashboardElementRepo>;
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
				{
					provide: DashboardElementRepo,
					useValue: createMock<DashboardElementRepo>(),
				},
			],
		}).compile();
		dashboardService = module.get(DashboardService);
		userRepo = module.get(UserRepo);
		dashboardRepo = module.get('DASHBOARD_REPO');
		dashboardElementRepo = module.get(DashboardElementRepo);
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

		it('should call dashboardRepo.getUsersDashboard', async () => {
			const { user } = setup();
			const spy = jest.spyOn(dashboardRepo, 'getUsersDashboard');

			await dashboardService.deleteDashboardByUserId(user.id);

			expect(spy).toHaveBeenCalledWith(user.id);
		});

		it('should call dashboardRepo.deleteDashboardByUserId', async () => {
			const { user } = setup();
			const spy = jest.spyOn(dashboardRepo, 'deleteDashboardByUserId');

			await dashboardService.deleteDashboardByUserId(user.id);

			expect(spy).toHaveBeenCalledWith(user.id);
		});

		it('should delete users dashboard', async () => {
			const { user } = setup();
			jest.spyOn(dashboardRepo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

			const result = await dashboardService.deleteDashboardByUserId(user.id);

			expect(result).toEqual(1);
		});
	});
});
