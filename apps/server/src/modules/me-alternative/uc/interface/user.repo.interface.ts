import { User } from '../../domain/user';

export interface UserRepo {
	getUserById(userId: string): Promise<User>;
}

export const USER_REPO = 'USER_REPO';
