import { Permission, Role } from '@shared/domain';
import { roleFactory, setupEntities } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { RoleMapper } from '@src/modules/role/mapper/role.mapper';

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
		const entity: Role = roleFactory.buildWithId({ permissions: [Permission.DELETE_TEAM, Permission.COMMENTS_EDIT] });

		// Act
		const dto: RoleDto = RoleMapper.mapFromEntityToDto(entity);

		// Assert
		expect(dto.id).toEqual(entity.id);
		expect(dto.name).toEqual(entity.name);
		expect(dto.permissions).toEqual(entity.permissions);
	});

	it('mapFromEntitiesToDtos', () => {
		// Arrange
		const roles: Role[] = [roleFactory.buildWithId(), roleFactory.buildWithId()];

		// Act
		const dtos: RoleDto[] = RoleMapper.mapFromEntitiesToDtos(roles);

		// Assert
		expect(dtos.length).toEqual(roles.length);
		expect(dtos[0].id).toEqual(roles[0].id);
		expect(dtos[1].id).toEqual(roles[1].id);
	});
});
