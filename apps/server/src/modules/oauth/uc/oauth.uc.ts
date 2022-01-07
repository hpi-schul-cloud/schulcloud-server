import { Injectable } from "@nestjs/common";
import { ILogger, Logger } from "@src/core/logger";

@Injectable()
export class OauthUc {
    private logger: ILogger;

	constructor() {
		this.logger = new Logger(OauthUc.name);
	}
}