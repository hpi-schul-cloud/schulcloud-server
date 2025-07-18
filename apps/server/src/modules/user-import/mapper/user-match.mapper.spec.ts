import { RoleName } from '@modules/role';
import { roleFactory } from '@modules/role/testing';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { setupEntities } from '@testing/database';
import { MatchType, UserRole } from '../controller/dto';
import { FilterUserParams } from '../controller/dto/filter-user.params';
import { MatchCreator } from '../entity';
import { ImportUserMatchMapper } from './match.mapper';
import { UserMatchMapper } from './user-match.mapper';

describe('[UserMatchMapper]', () => {
	beforeAll(async () => {
		await setupEntities([User]);
	});

	describe('[mapToDomain] from query', () => {
		it('should map name to fullname if trimmed string not empty ', () => {
			const query: FilterUserParams = { name: ' Nala ' };

			const result = UserMatchMapper.mapToDomain(query);

			expect(result.name).toEqual('Nala');
		});

		it('should fail for whitespace name string', () => {
			const query: FilterUserParams = { name: ' ' };

			const result = () => UserMatchMapper.mapToDomain(query);

			expect(result).toThrowError('invalid name from query');
		});

		it('should skip name mapper if no name is provided without failing', () => {
			const query: FilterUserParams = {};

			const result = UserMatchMapper.mapToDomain(query);

			expect(result.name).toEqual(undefined);
		});
	});
	describe('[mapToResponse] from domain', () => {
		describe('When having a user provided only', () => {
			it('should map role name student', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: RoleName.STUDENT })] });

				const result = UserMatchMapper.mapToResponse(user);

				expect(result.roleNames).toContainEqual(UserRole.STUDENT);
			});

			it('should map role name admin', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: RoleName.ADMINISTRATOR })] });

				const result = UserMatchMapper.mapToResponse(user);

				expect(result.roleNames).toContainEqual(UserRole.ADMIN);
			});

			it('should map role name teacher', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: RoleName.TEACHER })] });

				const result = UserMatchMapper.mapToResponse(user);

				expect(result.roleNames).toContainEqual(UserRole.TEACHER);
			});

			it('should not map other role names like superhero', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: RoleName.SUPERHERO })] });

				const result = UserMatchMapper.mapToResponse(user);

				expect(result.roleNames.length).toEqual(0);
			});

			it('should not set matchedBy', () => {
				const user = userFactory.build();

				const result = UserMatchMapper.mapToResponse(user);

				expect(result.matchedBy).toBeUndefined();
			});
		});

		describe('when having a match provided', () => {
			it('should set matchedBy property by the mapped value', () => {
				const user = userFactory.build();
				const ImportUserMatchMapperSpy = jest
					.spyOn(ImportUserMatchMapper, 'mapMatchCreatorToResponse')
					.mockReturnValue('MAPPED_MATCH_VALUE' as MatchType);

				const result = UserMatchMapper.mapToResponse(user, MatchCreator.AUTO);

				expect(result.matchedBy).toEqual('MAPPED_MATCH_VALUE');
				expect(ImportUserMatchMapperSpy).toBeCalledTimes(1);
				expect(ImportUserMatchMapperSpy).toBeCalledWith(MatchCreator.AUTO);

				ImportUserMatchMapperSpy.mockClear();
			});
		});
	});
});
