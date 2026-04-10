import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { UserChangedSchoolEvent } from '../../user/domain/events/user-changed-school.event';
import { TeamRepo } from '../repo/team.repo';
import { UserChangedSchoolHandlerService } from './user-changed-school-handler.service';
import { MikroORM } from '@mikro-orm/core';

describe(UserChangedSchoolHandlerService.name, () => {
	let module: TestingModule;
	let service: UserChangedSchoolHandlerService;
	let teamRepo: DeepMocked<TeamRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserChangedSchoolHandlerService,
				{
					provide: TeamRepo,
					useValue: createMock<TeamRepo>(),
				},
				{
					provide: MikroORM,
					useValue: createMock<MikroORM>(),
				},
			],
		}).compile();

		service = module.get(UserChangedSchoolHandlerService);
		teamRepo = module.get(TeamRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should call removeUserReferences with the correct userId', async () => {
		const userId = 'test-user-id';
		const event = new UserChangedSchoolEvent(userId, 'oldSchoolId');
		teamRepo.removeUserReferences.mockResolvedValue(1);

		await service.handle(event);

		expect(teamRepo.removeUserReferences).toHaveBeenCalledWith(userId);
	});
});
