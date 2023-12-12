import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardElementRepo, IDashboardRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { EntityId, LearnroomMetadata, LearnroomTypes } from '@shared/domain/types';
import { DashboardEntity, GridElement } from '@shared/domain/entity';
import { DashboardService } from '.';

const learnroomMock = (id: string, name: string) => {
	return {
		getMetadata(): LearnroomMetadata {
			return {
				id,
				type: LearnroomTypes.Course,
				title: name,
				shortTitle: name.substr(0, 2),
				displayColor: '#ACACAC',
			};
		},
	};
};

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

		it('should call dashboardElementRepo.deleteByDashboardId', async () => {
			const { user } = setup();
			jest.spyOn(dashboardRepo, 'getUsersDashboard').mockResolvedValueOnce(
				new DashboardEntity('dashboardId', {
					grid: [
						{
							pos: { x: 1, y: 2 },
							gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
						},
					],
					userId: 'userId',
				})
			);
			const spy = jest.spyOn(dashboardElementRepo, 'deleteByDashboardId');

			await dashboardService.deleteDashboardByUserId(user.id);

			expect(spy).toHaveBeenCalledWith('dashboardId');
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
