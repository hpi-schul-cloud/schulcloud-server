import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test } from '@nestjs/testing';
import { TaskRepo } from './task.repo';

describe('TaskService', () => {
	it('should be defined', async () => {
		const module = await Test.createTestingModule({
			providers: [
				TaskRepo,
				{
					provide: EntityManager,
					useValue: {
						find: (entity: any, query: any) => {
							return [{ _id: new ObjectId(), name: 'testtask' }];
						},
					},
				},
			],
		}).compile();

		const service = module.get<TaskRepo>(TaskRepo);
		expect(service).toBeDefined();
		expect(module.get<EntityManager>(EntityManager)).toBeDefined();

		/* const result = await service.findAllOpenByStudent('abcde');
		expect(result.length).toEqual(1); */
	});
});
