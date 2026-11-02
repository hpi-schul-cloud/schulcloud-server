import { Test, type TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../../user/domain/events/user-changed-school.event';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';
import { userFactory } from '../../../user/testing';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { CourseEntity } from '../../repo';
import { schoolEntityFactory } from '@modules/school/testing';

describe(UserChangedSchoolHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolHandlerService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolHandlerService,
				{
					provide: MikroORM,
					useValue: await setupEntities([CourseEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolHandlerService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('handle', () => {
		it('should succeed without throwing when handling event (softened handler)', async () => {
			const school = schoolEntityFactory.buildWithId();
			const user = userFactory.build({ school });
			const userId = user.id;
			const oldSchoolId = 'school456';
			const event = new UserChangedSchoolEvent(userId, oldSchoolId);

			await expect(service.handle(event)).resolves.not.toThrow();
		});
	});
});
