import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthEntity } from './entities/auth.entity';
import { UserDTO } from './dto/user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

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
