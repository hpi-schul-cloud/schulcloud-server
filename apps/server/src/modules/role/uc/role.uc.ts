import { RoleDto } from '@modules/role/service/dto/role.dto';
import { RoleService } from '@modules/role/service/role.service';
import { Injectable } from '@nestjs/common';
import { RoleName } from '@shared/domain/interface';

@Injectable()
export class RoleUc {
	constructor(private readonly roleService: RoleService) {}

	async findByNames(names: RoleName[]): Promise<RoleDto[]> {
		const promise: Promise<RoleDto[]> = this.roleService.findByNames(names);
		return promise;
	}
}
