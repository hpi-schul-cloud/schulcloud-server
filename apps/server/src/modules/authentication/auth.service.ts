import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UsersService } from '../user/users.service';
import { AuthEntity } from './entity/auth.entity';

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
		throw new NotImplementedException();
	}
}
