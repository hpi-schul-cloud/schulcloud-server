import { Test, TestingModule } from '@nestjs/testing';
import { TeamMapper } from '@src/modules/collaborative-storage/mapper/team.mapper';
import { teamFactory } from '@shared/testing/factory/team.factory';
import { setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';

describe('TeamMapper', () => {
	let module: TestingModule;
	let mapper: TeamMapper;
	let orm: MikroORM;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [TeamMapper],
		}).compile();
		mapper = module.get(TeamMapper);
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('Map Team', () => {
		it('should map entity to dto', () => {
			const teamEntity = teamFactory.build();
			const ret = mapper.mapEntityToDto(teamEntity);
			expect(ret.id).toEqual(teamEntity.id);
			expect(ret.teamUsers.length).toEqual(1);
		});
	});
});
