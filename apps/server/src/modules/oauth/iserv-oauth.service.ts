import { Injectable, Inject } from '@nestjs/common';
import { User } from '@shared/domain';
import { SymetricKeyEncryptionService } from '@shared/infra/encryption';
import { UserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { HttpService } from '@nestjs/axios';
import { FeathersJwtProvider } from '../authorization';
import { OAuthSSOError } from './error/oauth-sso.error';
import { OAuthService, IJWT } from './oauth.service';

@Injectable()
export class IservOAuthService {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly jwtService: FeathersJwtProvider,
		private httpService: HttpService,
		@Inject('OAuthEncryptionService') private readonly oAuthEncryptionService: SymetricKeyEncryptionService,
		private logger: Logger
	) {
		this.logger.setContext(OAuthService.name);
	}

	extractUUID(decodedJwt: IJWT): string {
		if (!decodedJwt || !decodedJwt.uuid) throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		const { uuid } = decodedJwt;
		return uuid;
	}

	async findUserById(uuid: string, systemId: string): Promise<User> {
		let user: User;
		try {
			user = await this.userRepo.findByLdapId(uuid, systemId);
		} catch (error) {
			throw new OAuthSSOError('Failed to find user with this ldapId', 'sso_user_notfound');
		}
		return user;
	}
}
