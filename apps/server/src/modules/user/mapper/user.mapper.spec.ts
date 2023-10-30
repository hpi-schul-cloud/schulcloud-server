import { User } from '@shared/domain/entity/user.entity';
import { roleFactory } from '@shared/testing/factory/role.factory';
import { userFactory } from '@shared/testing/factory/user.factory';
import { setupEntities } from '@shared/testing/setup-entities';
import { UserDto } from '../uc/dto/user.dto';
import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
	let userEntity: User;

	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(() => {
		userEntity = userFactory.buildWithId({ roles: [roleFactory.buildWithId()] });
	});

	it('mapFromEntityToDto', () => {
		const resultDto: UserDto = UserMapper.mapFromEntityToDto(userEntity);

		expect(resultDto.id).toEqual(userEntity.id);
		expect(resultDto.email).toEqual(userEntity.email);
		expect(resultDto.firstName).toEqual(userEntity.firstName);
		expect(resultDto.lastName).toEqual(userEntity.lastName);
		expect(resultDto.schoolId).toEqual(userEntity.school.id);
		expect(resultDto.roleIds).toEqual(userEntity.roles.getItems().map((role) => role.id));
		expect(resultDto.ldapDn).toEqual(userEntity.ldapDn);
		expect(resultDto.externalId).toEqual(userEntity.externalId);
		expect(resultDto.language).toEqual(userEntity.language);
		expect(resultDto.forcePasswordChange).toEqual(userEntity.forcePasswordChange);
		expect(resultDto.preferences).toEqual(userEntity.preferences);
		expect(resultDto.lastLoginSystemChange).toEqual(userEntity.lastLoginSystemChange);
		expect(resultDto.outdatedSince).toEqual(userEntity.outdatedSince);
	});
});
