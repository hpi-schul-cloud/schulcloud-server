import { Permission } from '@shared/domain/interface';
import { Role } from '../repo';
import { roleFactory } from '../testing';
import { RoleDto } from '../service';
import { RoleMapper } from './role.mapper';

describe('RoleMapper', () => {
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
