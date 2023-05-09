import { createMock } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { CollaborativeStorageAdapter } from '@shared/infra/collaborative-storage/collaborative-storage.adapter';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { ICollaborativeStorageStrategy } from '@shared/infra/collaborative-storage/strategy/base.interface.strategy';
import { LegacyLogger } from '@src/core/logger';
import { TeamDto } from '@src/modules/collaborative-storage/services/dto/team.dto';

class TestStrategy implements ICollaborativeStorageStrategy {
	baseURL: string;

	constructor() {
		this.baseURL = 'mocked';
	}

	updateTeamPermissionsForRole(): Promise<void> {
		return Promise.resolve();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	deleteTeam(teamId: string): Promise<void> {
		return Promise.resolve();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	createTeam(team: TeamDto): Promise<void> {
		return Promise.resolve();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	updateTeam(team: TeamDto): Promise<void> {
		return Promise.resolve();
	}
}

describe('CollaborativeStorage Adapter', () => {
	let module: TestingModule;
	let adapter: CollaborativeStorageAdapter;
	let strategy: ICollaborativeStorageStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CollaborativeStorageAdapter,
				CollaborativeStorageAdapterMapper,
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
				{
					provide: 'ICollaborativeStorageStrategy',
					useValue: createMock<ICollaborativeStorageStrategy>(),
				},
			],
		}).compile();
		adapter = module.get(CollaborativeStorageAdapter);
		strategy = adapter.strategy;
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('setStrategy', () => {
		it('should set a new strategy', () => {
			const testStrat = new TestStrategy();
			adapter.setStrategy(testStrat);
			expect(adapter.strategy).toEqual(testStrat);
		});
		afterAll(() => {
			adapter.setStrategy(strategy);
		});
	});

	describe('updateTeamPermissionsForRole', () => {
		it('should call the strategy', async () => {
			await adapter.updateTeamPermissionsForRole(
				{
					id: 'teamId',
					name: 'teamName',
					teamUsers: [{ userId: 'testUser', roleId: 'testRole', schoolId: 'testschool' }],
				},
				{ id: 'testRole', name: RoleName.DEMO },
				{
					read: false,
					write: false,
					create: false,
					delete: false,
					share: false,
				}
			);
			expect(strategy.updateTeamPermissionsForRole).toHaveBeenCalled();
		});
	});

	describe('deleteTeam', () => {
		it('should call the strategy', async () => {
			const teamIdMock = new ObjectId().toHexString();
			await adapter.deleteTeam(teamIdMock);
			expect(strategy.deleteTeam).toHaveBeenCalledWith(teamIdMock);
		});
	});

	describe('createTeam', () => {
		it('should call the strategy', async () => {
			const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };
			await adapter.createTeam(teamDto);
			expect(strategy.createTeam).toHaveBeenCalledWith(teamDto);
		});
	});

	describe('updateTeam', () => {
		it('should call the strategy', async () => {
			const teamDto: TeamDto = { id: 'id', name: 'name', teamUsers: [] };
			await adapter.updateTeam(teamDto);
			expect(strategy.updateTeam).toHaveBeenCalledWith(teamDto);
		});
	});
});
