import { Controller, Req, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ICurrentUser } from '../interface';
import { AuthenticationService } from '../services/authentication.service';

@ApiTags('Authentication')
@Controller('authentication')
export class LoginController {
	constructor(private authService: AuthenticationService) {}

	@UseGuards(AuthGuard('ldap'))
	@HttpCode(HttpStatus.OK)
	@Post('ldap')
	loginLdap(@Req() req: { user: ICurrentUser }) {
		return this.authService.generateJwt(req.user);
	}

	@UseGuards(AuthGuard('local'))
	@HttpCode(HttpStatus.OK)
	@Post('local')
	loginLocal(@Req() req: { user: ICurrentUser }) {
		return this.authService.generateJwt(req.user);
	}
}
