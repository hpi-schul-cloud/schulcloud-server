import { TeamEntity } from '@modules/team/repo';
import { teamFactory } from '@modules/team/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { TeamMapper } from './team.mapper';

describe('TeamMapper', () => {
	let module: TestingModule;
	let mapper: TeamMapper;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [TeamMapper],
		}).compile();
		mapper = module.get(TeamMapper);
		await setupEntities([TeamEntity]);
	});

	afterAll(async () => {
		await module.close();
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
			expect(ret.teamUsers[0].userId).toEqual(teamUser.user.id);
			expect(ret.teamUsers[0].roleId).toEqual(teamUser.role.id);
			expect(ret.teamUsers[0].schoolId).toEqual(teamUser.school.id);
		});
	});
});
