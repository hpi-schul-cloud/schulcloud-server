import { Test, TestingModule } from '@nestjs/testing';
import { TeamPermissionsMapper } from '@src/modules/team-storage/mapper/team-permissions.mapper';
import { TeamPermissionsBody } from '@src/modules/team-storage/controller/dto/team-permissions.body.params';

describe('TeamMapper', () => {
	let module: TestingModule;
	let mapper: TeamPermissionsMapper;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [TeamPermissionsMapper],
		}).compile();
		mapper = module.get(TeamPermissionsMapper);
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
