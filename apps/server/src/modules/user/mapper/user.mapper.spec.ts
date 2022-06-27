import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { SchoolDto } from '@src/modules/school/uc/dto/school.dto';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { Permission, Role, RoleName, School, User } from '@shared/domain';
import { RoleMapper } from '@src/modules/role/mapper/role.mapper';
import { MikroORM } from '@mikro-orm/core';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';

describe('UserMapper', () => {
	let orm: MikroORM;
	let schoolDto: SchoolDto;
	let roleDto: RoleDto;
	let userDto: UserDto;
	let userEntity: User;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		userEntity = userFactory.buildWithId({ roles: [roleFactory.buildWithId()] });
		schoolDto = new SchoolDto({ name: userEntity.school.name });
		roleDto = new RoleDto({
			name: userEntity.roles.getItems()[0].name,
			permissions: userEntity.roles.getItems()[0].permissions,
		});
		userDto = new UserDto({
			id: userEntity.id,
			email: userEntity.email,
			firstName: userEntity.firstName,
			lastName: userEntity.lastName,
			roles: [roleDto],
			school: schoolDto,
			preferences: userEntity.preferences,
		});
	});

	it('mapFromEntityToDto', () => {
		// Act
		const resultDto: UserDto = UserMapper.mapFromEntityToDto(userEntity);

		// Assert
		expect(resultDto.id).toEqual(userEntity.id);
		expect(resultDto.email).toEqual(userEntity.email);
		expect(resultDto.firstName).toEqual(userEntity.firstName);
		expect(resultDto.lastName).toEqual(userEntity.lastName);
		expect(resultDto.school).toEqual(userEntity.school);
		expect(resultDto.roles).toEqual(RoleMapper.mapFromEntitiesToDtos(userEntity.roles.getItems()));
		expect(resultDto.ldapDn).toEqual(userEntity.ldapDn);
		expect(resultDto.ldapId).toEqual(userEntity.ldapId);
		expect(resultDto.language).toEqual(userEntity.language);
		expect(resultDto.forcePasswordChange).toEqual(userEntity.forcePasswordChange);
		expect(resultDto.preferences).toEqual(userEntity.preferences);
	});
	it('mapFromDtoToEntity', () => {
		// Act
		const resultEntity: User = UserMapper.mapFromDtoToEntity(userDto, userEntity.roles.getItems());

		// Assert
		expect(resultEntity.id).toEqual(userDto.id);
		expect(resultEntity.email).toEqual(userDto.email);
		expect(resultEntity.firstName).toEqual(userDto.firstName);
		expect(resultEntity.lastName).toEqual(userDto.lastName);
		expect(resultEntity.school.name).toEqual(userDto.school.name);
		expect(resultEntity.roles[0].name).toEqual(roleDto.name);
		expect(resultEntity.ldapDn).toEqual(userDto.ldapDn);
		expect(resultEntity.ldapId).toEqual(userDto.ldapId);
		expect(resultEntity.language).toEqual(userDto.language);
		expect(resultEntity.forcePasswordChange).toEqual(userDto.forcePasswordChange);
		expect(resultEntity.preferences).toEqual(userDto.preferences);
	});

	it('mapFromEntityToEntity', () => {
		// Arrange
		const resultEntity: User = new User({
			email: 'overrideMe',
			firstName: 'overrideMe',
			lastName: 'overrideMe',
			roles: [new Role({ name: RoleName.DEMO, permissions: [Permission.ADMIN_EDIT] })],
			school: new School({
				name: 'overrideMe',
			}),
		});
		resultEntity.id = 'overrideMe12';

		// Act
		UserMapper.mapFromEntityToEntity(resultEntity, userEntity);

		// Assert
		expect(resultEntity.id).toEqual(userEntity.id);
		expect(resultEntity.email).toEqual(userEntity.email);
		expect(resultEntity.firstName).toEqual(userEntity.firstName);
		expect(resultEntity.lastName).toEqual(userEntity.lastName);
		expect(resultEntity.school).toEqual(userEntity.school);
		expect(resultEntity.roles).toEqual(userEntity.roles);
		expect(resultEntity.ldapDn).toEqual(userEntity.ldapDn);
		expect(resultEntity.ldapId).toEqual(userEntity.ldapId);
		expect(resultEntity.language).toEqual(userEntity.language);
		expect(resultEntity.forcePasswordChange).toEqual(userEntity.forcePasswordChange);
		expect(resultEntity.preferences).toEqual(userEntity.preferences);
	});
});
