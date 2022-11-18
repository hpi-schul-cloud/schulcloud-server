import { Controller, Req, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ICurrentUser } from '@shared/domain';
import { AuthenticationService } from '../authentication.service';

@Controller('authentication')
export class LoginController {
	constructor(private authService: AuthenticationService) {}

	@UseGuards(AuthGuard('local'))
	@Post()
	login(@Req() req: { user: ICurrentUser }) {
		return this.authService.generateJwt(req.user);
	}
}
