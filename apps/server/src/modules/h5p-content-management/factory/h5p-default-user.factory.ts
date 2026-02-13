import { IUser } from '@lumieducation/h5p-server';

export class H5pDefaultUserFactory {
	public static create(): IUser {
		const user = {
			email: 'a@b.de',
			id: 'a',
			name: 'a',
			type: 'local',
		};

		return user;
	}
}
