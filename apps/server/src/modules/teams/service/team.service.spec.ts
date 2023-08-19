import { createMock } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsRepo } from '@shared/repo';
import { EntityId, UserDO } from '@shared/domain';
import { setupEntities, userDoFactory } from '@shared/testing';
import { TeamService } from './team.service';

describe('TeamsService', () => {
	let module: TestingModule;
	let service: TeamService;

	// let teamsRepo: DeepMocked<TeamsRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				TeamService,
				{
					provide: TeamsRepo,
					useValue: createMock<TeamsRepo>(),
				},
			],
		}).compile();

		service = module.get(TeamService);
		// teamsRepo = module.get(TeamsRepo);

		await setupEntities();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('findByUserId', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const userId = user.id as EntityId;

				return {
					userId,
				};
			};

			it('should throw an error', async () => {
				const { userId } = setup();

				await expect(service.findByUserId(userId)).rejects.toThrowError(InternalServerErrorException);
			});
		});
	});
});
