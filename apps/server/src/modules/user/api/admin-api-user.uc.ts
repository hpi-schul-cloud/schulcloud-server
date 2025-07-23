import { AccountSave, AccountService } from '@modules/account';
import { RoleName, RoleService } from '@modules/role';
import { Injectable } from '@nestjs/common';
import { RoleReference } from '@shared/domain/domainobject';
import { EntityId } from '@shared/domain/types';
import { nanoid } from 'nanoid';
import { UserService } from '../domain';
import { CourseService } from '@modules/course';
import { UserMikroOrmRepo } from '../repo';
import { TypeGuard } from '@shared/common/guards';

@Injectable()
export class AdminApiUserUc {
	constructor(
		private readonly accountService: AccountService,
		private readonly roleService: RoleService,
		private readonly userService: UserService,
		private readonly userRepo: UserMikroOrmRepo,
		private readonly courseService: CourseService
	) {}

	public async createUserAndAccount(props: {
		email: string;
		firstName: string;
		lastName: string;
		roleNames: RoleName[];
		schoolId: EntityId;
		courseId?: EntityId;
	}): Promise<CreateddUserAndAccount> {
		const roleDtos = await this.roleService.findByNames(props.roleNames);
		const roles = roleDtos.map((r) => {
			if (!r.id) throw new Error();
			return new RoleReference({ ...r, id: r.id });
		});
		const userDo = await this.userService.save({ ...props, roles, secondarySchools: [] });

		TypeGuard.requireKeys(userDo, ['id']);

		if (props.courseId) {
			const course = await this.courseService.findById(props.courseId);
			const user = await this.userRepo.findById(userDo.id);

			if (props.roleNames.findIndex((name) => name === RoleName.TEACHER) >= 0) {
				course.teachers.add(user);
			}
			if (props.roleNames.findIndex((name) => name === RoleName.STUDENT) >= 0) {
				course.students.add(user);
			}

			await this.courseService.save(course);
		}

		const initialPassword = nanoid(12);
		const account = await this.accountService.save({
			username: props.email,
			userId: userDo.id,
			password: initialPassword,
			activated: true,
		} as AccountSave);
		return {
			userId: userDo.id,
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
