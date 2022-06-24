import { Role } from '@shared/domain';
import { Injectable } from '@nestjs/common';
import { RoleDto } from '../services/dto/role.dto';

@Injectable()
export class RoleMapper {
	/**
	 * Maps the Role Entity to the Service-DTO
	 * @param roleEntity Das Role-Entity
	 * @return Das Dto
	 */
	public mapEntityToDto(roleEntity: Role): RoleDto {
		return new RoleDto({ id: roleEntity.id, name: roleEntity.name });
	}
}
