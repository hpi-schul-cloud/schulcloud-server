import { ObjectId } from '@mikro-orm/mongodb';

export interface UserForLogin {
	id: string;
	school: { id: string };
	roles: { id: string }[];
}

export interface UserForLoginParams {
	id?: string;
	schoolId?: string;
	roleId?: string;
}

export const userForLoginFactory = {
	build(params: UserForLoginParams = {}): UserForLogin {
		return {
			id: params.id ?? new ObjectId().toHexString(),
			school: { id: params.schoolId ?? new ObjectId().toHexString() },
			roles: [{ id: params.roleId ?? new ObjectId().toHexString() }],
		};
	},
};
