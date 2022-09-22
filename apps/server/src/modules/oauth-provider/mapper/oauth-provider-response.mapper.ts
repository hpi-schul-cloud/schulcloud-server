import { Injectable } from '@nestjs/common';
import { ProviderRedirectResponse } from '@shared/infra/oauth-provider/dto';
import { RedirectResponse } from '@src/modules/oauth-provider/controller/dto/response/redirect.response';

@Injectable()
export class OauthProviderResponseMapper {
	mapRedirectResponse(response: ProviderRedirectResponse): RedirectResponse {
		return new RedirectResponse(response.redirect_to);
	}
}
