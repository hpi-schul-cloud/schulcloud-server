import { MikroORM } from '@mikro-orm/core';
import { User } from '@shared/domain';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';

describe('UserMapper', () => {
	let orm: MikroORM;
	let userEntity: User;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
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
