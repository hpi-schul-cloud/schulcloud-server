import { Test, TestingModule } from '@nestjs/testing';
import { CollaborativeStorageAdapter } from '@shared/infra/collaborative-storage/collaborative-storage.adapter';
import { ICollaborativeStorageStrategy } from '@shared/infra/collaborative-storage/strategy/base.interface.strategy';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';
import { RoleName } from '@shared/domain';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@src/core/logger';

class TestStrategy implements ICollaborativeStorageStrategy {
	baseURL: string;

	constructor() {
		this.baseURL = 'mocked';
	}

	updateTeamPermissionsForRole(): void {}

	deleteGroupfolderAndRemoveGroup(teamId: string): void {}
}

describe('CollaborativeStorage Adapter', () => {
	let module: TestingModule;
	let adapter: CollaborativeStorageAdapter;
	let strat: ICollaborativeStorageStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				CollaborativeStorageAdapter,
				CollaborativeStorageAdapterMapper,
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: 'ICollaborativeStorageStrategy',
					useValue: createMock<ICollaborativeStorageStrategy>(),
				},
			],
		}).compile();
		adapter = module.get(CollaborativeStorageAdapter);
		strat = adapter.strategy;
	});

	describe('Set Strategy', () => {
		it('should set a new strategy', () => {
			const testStrat = new TestStrategy();
			adapter.setStrategy(testStrat);
			expect(adapter.strategy).toEqual(testStrat);
		});
		afterAll(() => {
			adapter.setStrategy(strat);
		});
	});

	describe('Update Team Permissions For Role', () => {
		it('should call the strategy', () => {
			adapter.updateTeamPermissionsForRole(
				{
					id: 'teamId',
					name: 'teamName',
					userIds: [{ userId: 'testUser', role: 'testRole', schoolId: 'testschool' }],
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
			expect(strat.updateTeamPermissionsForRole).toHaveBeenCalled();
		});
	});

	describe('Delete Team from Nextcloud', () => {
		it('should call the strategy', () => {
			const teamIdMock = 'teamIdMock';
			adapter.deleteTeam(teamIdMock);
			expect(strat.deleteGroupfolderAndRemoveGroup).toHaveBeenCalled();
		});
	});
});
