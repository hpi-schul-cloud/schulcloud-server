import { Injectable } from '@nestjs/common';
import { User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { Logger } from '@src/core/logger';
import { OAuthSSOError } from '../error/oauth-sso.error';
import { IJwt } from '../interface/jwt.base.interface';

@Injectable()
export class IservOAuthService {
	constructor(private readonly userRepo: UserRepo, private logger: Logger) {
		this.logger.setContext(IservOAuthService.name);
	}

	extractUUID(decodedJwt: IJwt): string {
		if (!decodedJwt || !decodedJwt.uuid) throw new OAuthSSOError('Failed to extract uuid', 'sso_jwt_problem');
		const { uuid } = decodedJwt;
		return uuid;
	}

	async findUserById(systemId: string, decodedJwt: IJwt): Promise<User> {
		let ldapId = 'unknown';
		try {
			ldapId = this.extractUUID(decodedJwt);
			return await this.userRepo.findByLdapIdOrFail(ldapId, systemId);
		} catch (error) {
			this.logger.warn(error);
			throw new OAuthSSOError(`Failed to find user with ldapId: ${ldapId}`, 'sso_user_notfound');
		}
	}
}
