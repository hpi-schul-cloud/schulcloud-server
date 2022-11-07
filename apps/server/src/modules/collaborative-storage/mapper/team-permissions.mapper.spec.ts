import { Test, TestingModule } from '@nestjs/testing';
import { TeamPermissionsBody } from '@src/modules/collaborative-storage/controller/dto/team-permissions.body.params';
import { TeamPermissionsMapper } from '@src/modules/collaborative-storage/mapper/team-permissions.mapper';

describe('TeamMapper', () => {
	let module: TestingModule;
	let mapper: TeamPermissionsMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [TeamPermissionsMapper],
		}).compile();
		mapper = module.get(TeamPermissionsMapper);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('Map Team Permissions', () => {
		it('should map body to dto', () => {
			const body: TeamPermissionsBody = { read: false, write: false, create: false, delete: false, share: false };
			const ret = mapper.mapBodyToDto(body);
			expect(ret.read).toEqual(body.read);
			expect(ret.write).toEqual(body.write);
			expect(ret.create).toEqual(body.create);
			expect(ret.delete).toEqual(body.delete);
			expect(ret.share).toEqual(body.share);
		});
	});
});
