import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import {
	DomainDeletionReportBuilder,
	DomainName,
	DomainOperationReportBuilder,
	OperationType,
	UserDeletionInjectionService,
} from '@modules/deletion';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { DashboardService } from '.';
import { Dashboard, GridElement } from '../domain/do/dashboard';
import { DashboardElementRepo } from '../repo';
import { DASHBOARD_REPO, IDashboardRepo } from '../repo/mikro-orm/dashboard.repo';

describe(DashboardService.name, () => {
	let module: TestingModule;
	let dashboardRepo: IDashboardRepo;
	let dashboardElementRepo: DeepMocked<DashboardElementRepo>;
	let dashboardService: DeepMocked<DashboardService>;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				DashboardService,
				{
					provide: DASHBOARD_REPO,
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
				{
					provide: UserDeletionInjectionService,
					useValue: createMock<UserDeletionInjectionService>({
						injectUserDeletionService: jest.fn(),
					}),
				},
			],
		}).compile();
		dashboardService = module.get(DashboardService);
		dashboardRepo = module.get(DASHBOARD_REPO);
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
			const dashboard = new Dashboard(dashboardId, {
				grid: [
					{
						pos: { x: 1, y: 2 },
						gridElement: GridElement.FromPersistedReference(
							'elementId',
							courseEntityFactory.buildWithId({ name: 'Mathe' })
						),
					},
				],
				userId: user.id,
			});

			const expectedResult = DomainDeletionReportBuilder.build(DomainName.DASHBOARD, [
				DomainOperationReportBuilder.build(OperationType.DELETE, 1, [dashboardId]),
			]);

			return { dashboard, expectedResult, user };
		};

		describe('when dashboard exist', () => {
			it('should call dashboardRepo.getUsersDashboardIfExist', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should call dashboardElementRepo.deleteByDashboardId', async () => {
				const { dashboard, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				const spy = jest.spyOn(dashboardElementRepo, 'deleteByDashboardId');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(dashboard.id);
			});

			it('should call dashboardRepo.deleteDashboardByUserId', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'deleteDashboardByUserId');

				await dashboardService.deleteUserData(user.id);

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should delete users dashboard', async () => {
				const { dashboard, expectedResult, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				jest.spyOn(dashboardRepo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

				const result = await dashboardService.deleteUserData(user.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});
});
