import { Test, type TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { UserChangedSchoolGroupHandlerService } from './user-changed-school-group-handler.service';
import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@testing/database';
import { GroupEntity } from '../entity';

describe(UserChangedSchoolGroupHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolGroupHandlerService;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolGroupHandlerService,
				{
					provide: MikroORM,
					useValue: await setupEntities([GroupEntity]),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolGroupHandlerService);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('handle', () => {
		it('should succeed without throwing when handling event (softened handler)', async () => {
			const userId = 'user123';
			const event = new UserChangedSchoolEvent(userId, 'school456');

			await expect(service.handle(event)).resolves.not.toThrow();
		});
	});
});
