import { Test, TestingModule } from '@nestjs/testing';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { teamFactory } from '@shared/testing/factory/team.factory';

describe('TeamMapper', () => {
	let module: TestingModule;
	let mapper: TeamMapper;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [TeamMapper],
		}).compile();
		mapper = module.get(TeamMapper);
	});

	describe('Map Team', () => {
		it('should map entity to dto', () => {
			const teamEntity = teamFactory.build();
			const ret = mapper.mapEntityToDto(teamEntity);
			expect(ret.id).toEqual(teamEntity.id);
			expect(ret.userIds.length).toEqual(1);
		});
	});
});
