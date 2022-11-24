import { Controller, Req, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ICurrentUser } from '@shared/domain';
import { AuthenticationService } from '../services/authentication.service';

@Controller('authentication')
export class LoginController {
	constructor(private authService: AuthenticationService) {}

	@UseGuards(AuthGuard(['ldap', 'local']))
	@Post()
	login(@Req() req: { user: ICurrentUser }) {
		return this.authService.generateJwt(req.user);
	}
}
