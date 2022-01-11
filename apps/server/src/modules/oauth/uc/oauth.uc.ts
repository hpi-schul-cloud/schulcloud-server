import { Injectable } from '@nestjs/common';
import { ILogger, Logger } from '@src/core/logger';

@Injectable()
export class OauthUc {
	private logger: ILogger;

	constructor() {
		this.logger = new Logger(OauthUc.name);
	}

	// 1- use Authorization Code to get a valid Token

	// 1.1- Token Validation? (later)

	// 2- decode the Token to extract the UUID

	// 3- get user using the UUID (userHelpers.js?)

	// 3.1- User bestätigen?

	// 4- JWT erzeugen (oder finden)
}
