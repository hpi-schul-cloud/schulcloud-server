import { Test, TestingModule } from '@nestjs/testing';
import { TeamStorageAdapterMapper } from '@shared/infra/team-storage/mapper/team-storage-adapter.mapper';

describe('TeamStorage Mapper', () => {
	let module: TestingModule;
	let mapper: TeamStorageAdapterMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [TeamStorageAdapterMapper],
		}).compile();
		mapper = module.get(TeamStorageAdapterMapper);
	});

	describe('Map Domain To Adapter', () => {
		it('should map the domain dtos to adapter dto', () => {
			const ret = mapper.mapDomainToAdapter(
				{
					id: 'teamId',
					name: 'teamName',
					userIds: [{ userId: 'testUser', role: 'testRole', schoolId: 'testschool' }],
				},
				{ id: 'testRole', name: 'testRoleName' },
				{
					read: false,
					write: false,
					create: false,
					delete: false,
					share: false,
				}
			);
			expect(ret.teamId).toEqual('teamId');
			expect(ret.teamName).toEqual('teamName');
			expect(ret.roleName).toEqual('testRoleName');
			expect(ret.permissions).toEqual([false, false, false, false, false]);
		});
	});
});
