import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { OauthUc } from "../uc/oauth.uc";

@ApiTags('Oauth')
@Controller('oauth')
export class OauthController {
	constructor(private readonly oauthUc: OauthUc) {}
}