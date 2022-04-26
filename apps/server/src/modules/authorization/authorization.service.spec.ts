import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Actions, ALL_RULES, BaseEntity } from '@shared/domain';
import { courseFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';
import { AuthorizationService } from './authorization.service';

class TestEntity extends BaseEntity {}

describe('authorization.service', () => {
	let orm: MikroORM;
	let service: AuthorizationService;

	beforeAll(async () => {
		orm = await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [AuthorizationService, ...ALL_RULES],
		}).compile();

		service = await module.get(AuthorizationService);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('hasPermission', () => {
		it('throw an error if no rule exist', () => {
			const user = userFactory.build();
			const entity = new TestEntity();

			const exec = () => {
				service.hasPermission(user, entity, Actions.write);
			};
			expect(exec).toThrowError(NotImplementedException);
		});

		it('can resolve tasks', () => {
			const user = userFactory.build();
			const task = taskFactory.build({ creator: user });

			const response = service.hasPermission(user, task, Actions.write);
			expect(response).toBe(true);
		});

		it('can resolve courses', () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });

			const response = service.hasPermission(user, course, Actions.write);
			expect(response).toBe(true);
		});
	});
});
