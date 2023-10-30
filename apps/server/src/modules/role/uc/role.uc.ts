import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface/rolename.enum';
import { RoleDto } from '../service/dto/role.dto';
import { RoleService } from '../service/role.service';

@Injectable()
export class RoleUc {
	constructor(private readonly roleService: RoleService) {}

	async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const promise: Promise<RoleDto[]> = this.roleService.findByNames(names);
		return promise;
	}
}
