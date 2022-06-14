import { Role } from '@shared/domain';
import { RoleDto } from '../services/dto/Role.dto';
import {Injectable} from "@nestjs/common";

@Injectable()
export class RoleMapper {
	public mapEntityToDto(RoleEntity: Role): RoleDto {
		return new RoleDto({ id: RoleEntity.id, name: RoleEntity.name });
	}
}
