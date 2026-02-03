import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory } from '@modules/course/testing';
import {
	ModuleName,
	SagaService,
	StepOperationReportBuilder,
	StepOperationType,
	StepReportBuilder,
	UserDeletionStepOperationLoggable,
} from '@modules/saga';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { ObjectId } from '@mikro-orm/mongodb';
import { Dashboard, GridElement } from '../domain/do/dashboard';
import { DashboardElementRepo } from '../repo';
import { DASHBOARD_REPO, DashboardRepo, IDashboardRepo } from '../repo/mikro-orm/dashboard.repo';
import { DeleteUserDashboardDataStep } from './delete-user-dashboard-data.step';

describe(DeleteUserDashboardDataStep.name, () => {
	let module: TestingModule;
	let step: DeleteUserDashboardDataStep;
	let dashboardRepo: IDashboardRepo;
	let dashboardElementRepo: DeepMocked<DashboardElementRepo>;
	let logger: DeepMocked<Logger>;

	beforeAll(async () => {
		await setupEntities([User, CourseEntity, CourseGroupEntity]);

		module = await Test.createTestingModule({
			providers: [
				DeleteUserDashboardDataStep,
				{
					provide: SagaService,
					useValue: createMock<SagaService>(),
				},
				{
					provide: DASHBOARD_REPO,
					useValue: createMock<DashboardRepo>(),
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
		step = module.get(DeleteUserDashboardDataStep);
		dashboardRepo = module.get(DASHBOARD_REPO);
		dashboardElementRepo = module.get(DashboardElementRepo);
		logger = module.get(Logger);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('step registration', () => {
		it('should register the step with the saga service', () => {
			const sagaService = createMock<SagaService>();
			const step = new DeleteUserDashboardDataStep(
				sagaService,
				createMock<DashboardRepo>(),
				createMock<DashboardElementRepo>(),
				createMock<Logger>()
			);

			expect(sagaService.registerStep).toHaveBeenCalledWith(ModuleName.LEARNROOM_DASHBOARD, step);
		});
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

			const expectedResult = StepReportBuilder.build(ModuleName.LEARNROOM_DASHBOARD, [
				StepOperationReportBuilder.build(StepOperationType.DELETE, 1, [dashboardId]),
			]);

			return { dashboard, expectedResult, user };
		};

		describe('when dashboard exist', () => {
			it('should call dashboardRepo.getUsersDashboardIfExist', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist');

				await step.execute({ userId: user.id });

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should call dashboardElementRepo.deleteByDashboardId', async () => {
				const { dashboard, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				const spy = jest.spyOn(dashboardElementRepo, 'deleteByDashboardId');

				await step.execute({ userId: user.id });

				expect(spy).toHaveBeenCalledWith(dashboard.id);
			});

			it('should call dashboardRepo.deleteDashboardByUserId', async () => {
				const { user } = setup();
				const spy = jest.spyOn(dashboardRepo, 'deleteDashboardByUserId');

				await step.execute({ userId: user.id });

				expect(spy).toHaveBeenCalledWith(user.id);
			});

			it('should delete users dashboard', async () => {
				const { dashboard, expectedResult, user } = setup();
				jest.spyOn(dashboardRepo, 'getUsersDashboardIfExist').mockResolvedValueOnce(dashboard);
				jest.spyOn(dashboardRepo, 'deleteDashboardByUserId').mockImplementation(() => Promise.resolve(1));

				const result = await step.execute({ userId: user.id });

				expect(result).toEqual(expectedResult);
			});

			it('should log the deletion operation', async () => {
				const { user } = setup();

				await step.execute({ userId: user.id });

				expect(logger.info).toHaveBeenCalledWith(expect.any(UserDeletionStepOperationLoggable));
			});
		});
	});
});
