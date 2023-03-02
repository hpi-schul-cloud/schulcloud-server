import { ISession } from '@shared/domain/types/session';
import { OauthLoginStateDto } from '../uc/dto/oauth-login-state.dto';

export class OauthLoginStateMapper {
	static mapSessionToDto(session: ISession): OauthLoginStateDto {
		const dto = new OauthLoginStateDto(session.oauthLoginState as OauthLoginStateDto);
		return dto;
	}
}
