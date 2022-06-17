import { Role } from '@shared/domain';
import { RoleDto } from '../services/dto/Role.dto';
import {Injectable} from "@nestjs/common";

@Injectable()
export class RoleMapper {
	public mapEntityToDto(roleEntity: Role): RoleDto {
		return new RoleDto({ id: roleEntity._id.toString(), name: roleEntity.name });
	}
}
