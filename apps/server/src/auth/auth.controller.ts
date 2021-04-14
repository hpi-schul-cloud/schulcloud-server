import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { LocalAuthGuard } from './auth-local.guard';
import { AuthService } from './auth.service';
import { AuthEntity } from './Entities/auth.entity';
import { UserDTO } from './DTO/user.dto';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	/**  sample login route to generate jwt
	 * @param {string} username
	 * @param {string} password
	 */
	@UseGuards(LocalAuthGuard)
	@Post('login')
	async login(@Request() req, @Body() _user: UserDTO): Promise<AuthEntity> {
		return this.authService.login(req.user);
	}
}
