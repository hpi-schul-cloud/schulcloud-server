import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { GroupRepo } from '../repo/group.repo';
import { UserChangedSchoolGroupHandlerService } from './user-changed-school-group-handler.service';
import { type EntityManager, MikroORM, RequestContext } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { GroupEntity } from '../entity';

describe(UserChangedSchoolGroupHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolGroupHandlerService;
	let groupRepo: DeepMocked<GroupRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolGroupHandlerService,
				{
					provide: GroupRepo,
					useValue: createMock<GroupRepo>(),
				},
				{
					provide: MikroORM,
					useValue: await setupEntities([GroupEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolGroupHandlerService);
		groupRepo = module.get(GroupRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('handle', () => {
		it('should create an isolated context across asynchronous work and release it afterwards', async () => {
			const orm = module.get(MikroORM);
			const event = new UserChangedSchoolEvent('user123', 'school456');
			const contexts: EntityManager[] = [];
			groupRepo.removeUserReference.mockImplementation(async () => {
				const context = RequestContext.getEntityManager();
				expect(context).toBeDefined();
				expect(context).not.toBe(orm.em);
				await Promise.resolve();
				expect(RequestContext.getEntityManager()).toBe(context);
				if (!context) {
					throw new Error('Missing request context');
				}
				contexts.push(context);
				return 0;
			});

			await Promise.all([service.handle(event), service.handle(event)]);

			expect(contexts).toHaveLength(2);
			expect(contexts[0]).not.toBe(contexts[1]);
			expect(RequestContext.getEntityManager()).toBeUndefined();
		});

		it('should reuse an existing context', async () => {
			const orm = module.get(MikroORM);
			const event = new UserChangedSchoolEvent('user123', 'school456');

			await RequestContext.create(orm.em, async () => {
				const context = RequestContext.getEntityManager();
				groupRepo.removeUserReference.mockImplementation(async () => {
					await Promise.resolve();
					expect(RequestContext.getEntityManager()).toBe(context);
					return 0;
				});

				await service.handle(event);
			});

			expect(RequestContext.getEntityManager()).toBeUndefined();
		});

		it('should propagate errors and release the context', async () => {
			const error = new Error('Removing group reference failed');
			groupRepo.removeUserReference.mockRejectedValueOnce(error);

			await expect(service.handle(new UserChangedSchoolEvent('user123', 'school456'))).rejects.toBe(error);

			expect(RequestContext.getEntityManager()).toBeUndefined();
		});

		it('should remove user reference from all groups the user is part of', async () => {
			const userId = 'user123';
			const event = new UserChangedSchoolEvent(userId, 'school456');

			await service.handle(event);

			expect(groupRepo.removeUserReference).toHaveBeenCalledWith(userId);
		});
	});
});
