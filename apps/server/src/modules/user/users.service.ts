import { Injectable } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export class User {
	userId: string;

	username: string;

	password?: string;
}

@Injectable()
export class UsersService {
	private readonly users: User[] = [
		{
			userId: '1',
			username: 'john',
			password: 'changeme',
		},
		{
			userId: '2',
			username: 'maria',
			password: 'guess',
		},
	];

	async findOne(username: string): Promise<User | undefined> {
		return this.users.find((user) => user.username === username);
	}
}
