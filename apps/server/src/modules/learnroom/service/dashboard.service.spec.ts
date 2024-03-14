import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { DomainOperationBuilder } from '@shared/domain/builder';
import { DashboardEntity, GridElement } from '@shared/domain/entity';
import { DomainName, LearnroomMetadata, LearnroomTypes, OperationType } from '@shared/domain/types';
import { DashboardElementRepo, IDashboardRepo, UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { Logger } from '@src/core/logger';
import { ObjectId } from 'bson';
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
				isSynchronized: false,
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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

	describe('when deleting dashboard by userId', () => {
		const setup = () => {
			const user = userFactory.buildWithId();
			const dashboardId = new ObjectId().toHexString();
			const dashboard = new DashboardEntity(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference('elementId', learnroomMock('referenceId', 'Mathe')),
					},
				],
				userId: user.id,
			});
			userRepo.findById.mockResolvedValue(user);

			const expectedResult = DomainOperationBuilder.build(DomainName.DASHBOARD, OperationType.DELETE, 1, [dashboardId]);

			return { dashboard, expectedResult, user };
		};

		describe('when dashboard exist', () => {
			it('should call dashboardRepo.getUsersDashboardIfExist', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist');

				await dashboardService.deleteDashboardByUserId(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should call dashboardElementRepo.deleteByDashboardId', async () => {
				const { dashboard, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				const spy = jest.spyOn(dashboardElementRepo, 'deleteByDashboardId');

				await dashboardService.deleteDashboardByUserId(user.id);

				expect(spy).toHaveBeenCalledWith(dashboard.id);
			});

			it('should call dashboardRepo.deleteDashboardByUserId', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'deleteDashboardByUserId');

				await dashboardService.deleteDashboardByUserId(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should delete users dashboard', async () => {
				const { dashboard, expectedResult, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				jest.spyOn(dashboardRepo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

				const result = await dashboardService.deleteDashboardByUserId(user.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
