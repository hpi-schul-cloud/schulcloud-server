import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@modules/authorization';
import { EmailActivationService } from '../service';

@Injectable()
export class EmailActivationUc {
	constructor(
		private readonly authorizationService: AuthorizationService,
		private readonly emailActivationService: EmailActivationService
	) {}
}
