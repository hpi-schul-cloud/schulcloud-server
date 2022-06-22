import { Role } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { RoleDto } from '../services/dto/Role.dto';

@Injectable()
export class RoleMapper {
	public mapEntityToDto(roleEntity: Role): RoleDto {
		return new RoleDto({ id: roleEntity.id, name: roleEntity.name });
	}
}
