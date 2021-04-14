import { Injectable } from '@nestjs/common';
import { User, UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './Interfaces/JwtPayload';
import { AuthEntity } from './Entities/auth.entity';

@Injectable()
export class AuthService {
	constructor(private usersService: UsersService, private jwtService: JwtService) {}
	async validateUser(username: string, password: string): Promise<User | null> {
		const user = await this.usersService.findOne(username);
		if (user && user.password === password) {
			const { password, ...result } = user;
			// passport will add result to req.user
			return result as User;
		}
		return null;
	}

	async login(user: any): Promise<AuthEntity> {
		const payload: JwtPayload = { username: user.username, sub: user.userId };
		return {
			access_token: this.jwtService.sign(payload),
		} as AuthEntity;
	}
}
