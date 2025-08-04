import { AccountSave, AccountService } from '@modules/account';
import { RoleName, RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { nanoid } from 'nanoid';
import { UserService } from '../domain';

@Injectable()
export class AdminApiUserUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly roleService: RoleService,
		private readonly userService: UserService
	) {}

	public async createUserAndAccount(props: {
		email: string;
		firstName: string;
		lastName: string;
		roleNames: RoleName[];
		schoolId: EntityId;
	}): Promise<CreateddUserAndAccount> {
		const roleDtos = await this.roleService.findByNames(props.roleNames);
		const roles = roleDtos.map((r) => {
			if (!r.id) throw new Error();
			return new RoleReference({ ...r, id: r.id });
		});
		const user = await this.userService.save({ ...props, roles, secondarySchools: [] });
		if (!user.id) throw new Error();
		const initialPassword = nanoid(12);
		const account = await this.accountService.save({
			username: props.email,
			userId: user.id,
			password: initialPassword,
			activated: true,
		} as AccountSave);
		return {
			userId: user.id,
			accountId: account.id,
			username: account.username,
			initialPassword,
		};
	}
}

export type CreateddUserAndAccount = {
	userId: EntityId;
	accountId: EntityId;
	username: string;
	initialPassword: string;
};
