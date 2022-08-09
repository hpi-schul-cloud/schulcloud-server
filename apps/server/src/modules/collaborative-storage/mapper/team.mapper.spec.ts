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
		await module.close();
		await orm.close();
	});

	describe('Map Team', () => {
		it('should map entity to dto', () => {
			// Arrange
			const teamEntity = teamFactory.buildWithId();

			// Act
			const ret = mapper.mapEntityToDto(teamEntity);

			// Assert
			expect(ret.id).toEqual(teamEntity.id);
			expect(ret.teamUsers.length).toEqual(1);
			const teamUser = teamEntity.teamUsers[0];
			expect(ret.teamUsers[0].userId).toEqual(teamUser.userId.id);
			expect(ret.teamUsers[0].roleId).toEqual(teamUser.role.id);
			expect(ret.teamUsers[0].schoolId).toEqual(teamUser.schoolId.id);
		});
	});
});
