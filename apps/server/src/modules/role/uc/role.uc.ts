import { RoleService } from '@src/modules/role/service/role.service';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain';

@Injectable()
export class RoleUc {
	constructor(private readonly roleService: RoleService) {}

	async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const promise: Promise<RoleDto[]> = this.roleService.findByNames(names);
		return promise;
	}
}
