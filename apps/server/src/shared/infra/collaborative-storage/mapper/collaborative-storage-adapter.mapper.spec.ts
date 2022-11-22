import { Test, TestingModule } from '@nestjs/testing';
import { RoleName } from '@shared/domain';
import { CollaborativeStorageAdapterMapper } from '@shared/infra/collaborative-storage/mapper/collaborative-storage-adapter.mapper';

describe('TeamStorage Mapper', () => {
	let module: TestingModule;
	let mapper: CollaborativeStorageAdapterMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [CollaborativeStorageAdapterMapper],
		}).compile();
		mapper = module.get(CollaborativeStorageAdapterMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Map Domain To Adapter', () => {
		it('should map the domain dtos to adapter dto', () => {
			const ret = mapper.mapDomainToAdapter(
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
			expect(ret.teamId).toEqual('teamId');
			expect(ret.teamName).toEqual('teamName');
			expect(ret.roleName).toEqual(RoleName.DEMO);
			expect(ret.permissions).toEqual([false, false, false, false, false]);
		});
	});
});
