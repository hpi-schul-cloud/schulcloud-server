import { Permission, Role, RoleName } from '@shared/domain';
import { roleFactory, setupEntities } from '@shared/testing';
import { RoleDto } from '@src/modules/user/uc/dto/role.dto';
import { RoleMapper } from '@src/modules/user/mapper/role.mapper';
import { Collection, MikroORM } from '@mikro-orm/core';

describe('RoleMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('mapFromEntityToDto', () => {
		// Arrange
		const entity: Role = roleFactory.buildWithId();
		const subRoles: Role[] = [roleFactory.buildWithId(), roleFactory.buildWithId()];
		entity.permissions = [Permission.DELETE_TEAM, Permission.COMMENTS_EDIT];
		entity.roles = new Collection<Role>(entity);
		entity.roles.set(subRoles);

		// Act
		const dto: RoleDto = RoleMapper.mapFromEntityToDto(entity);

		// Assert
		expect(dto.name).toEqual(entity.name);
		expect(dto.roles?.[0].name).toEqual(entity.roles[0].name);
		expect(dto.roles?.[1].name).toEqual(entity.roles[1].name);
		expect(dto.permissions).toEqual(entity.permissions);
	});

	it('mapFromDtoToEntity', () => {
		// Arrange
		const roleDto: RoleDto = new RoleDto({
			permissions: [Permission.ACCOUNT_CREATE, Permission.DELETE_TEAM],
			roles: [],
			name: RoleName.STUDENT,
		});

		// Act
		const entity: Role = RoleMapper.mapFromDtoToEntity(roleDto);

		// Assert
		expect(entity.name).toEqual(roleDto.name);
		expect(entity.permissions).toEqual(roleDto.permissions);
	});

	it('mapFromEntitiesToDtos', () => {
		// Arrange
		const roles: Role[] = [roleFactory.buildWithId(), roleFactory.buildWithId()];

		// Act
		const dtos: RoleDto[] = RoleMapper.mapFromEntitiesToDtos(roles);

		// Assert
		expect(dtos.length).toEqual(roles.length);
		expect(dtos[0].name).toEqual(roles[0].name);
		expect(dtos[1].name).toEqual(roles[1].name);
	});

	it('mapFromDtosToEntities', () => {
		// Arrange
		const dtos: RoleDto[] = [
			new RoleDto({
				permissions: [Permission.ACCOUNT_CREATE, Permission.DELETE_TEAM],
				roles: [],
				name: RoleName.STUDENT,
			}),
			new RoleDto({
				permissions: [Permission.ADD_SCHOOL_MEMBERS],
				roles: [],
				name: RoleName.ADMINISTRATOR,
			}),
		];

		// Act
		const entities: Role[] = RoleMapper.mapFromDtosToEntities(dtos);

		// Assert
		expect(entities.length).toEqual(dtos.length);

		expect(entities[0].permissions).toEqual(dtos[0].permissions);
		expect(entities[0].roles).toEqual(dtos[0].roles);
		expect(entities[0].name).toEqual(dtos[0].name);

		expect(entities[1].permissions).toEqual(dtos[1].permissions);
		expect(entities[1].roles).toEqual(dtos[1].roles);
		expect(entities[1].name).toEqual(dtos[1].name);
	});
});
