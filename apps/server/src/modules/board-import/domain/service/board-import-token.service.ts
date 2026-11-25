import { CurrentUserBuilder, JwtPayloadBuilder, JwtPayloadVo } from '@infra/auth-guard';
import { JwtIssuerService } from '@infra/jwt-issuer';
import { JwtWhitelistAdapter } from '@infra/jwt-whitelist';
import { Logger } from '@infra/logger';
import { AccountService } from '@modules/account';
import { UserService } from '@modules/user';
import { Inject, Injectable } from '@nestjs/common';
import { BOARD_IMPORT_CONFIG_TOKEN, BoardImportConfig } from '../../board-import.config';
import { type BoardImportJob } from '../do';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';

const MILLISECONDS_PER_SECOND = 1000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
// A request that starts just before the deadline of the job must still be valid when the API checks it.
const LIFETIME_MARGIN_IN_SECONDS = 60;
// Makes the whitelist entries of the worker distinguishable from the sessions of users. See ADR 0011.
const TOKEN_ID_PREFIX = 'import_';

@Injectable()
export class BoardImportTokenService {
	constructor(
		@Inject(BOARD_IMPORT_CONFIG_TOKEN) private readonly config: BoardImportConfig,
		private readonly userService: UserService,
		private readonly accountService: AccountService,
		private readonly jwtIssuerService: JwtIssuerService,
		private readonly jwtWhitelistAdapter: JwtWhitelistAdapter,
		private readonly logger: Logger
	) {}

	public async createToken(job: BoardImportJob): Promise<string> {
		const [user, account] = await Promise.all([
			this.userService.findByIdOrNull(job.userId),
			this.accountService.findByUserId(job.userId),
		]);
		if (!user) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.USER_NOT_FOUND);
		}
		if (!account) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.ACCOUNT_NOT_FOUND);
		}
		if (account.deactivatedAt && account.deactivatedAt.getTime() <= Date.now()) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.ACCOUNT_DEACTIVATED);
		}

		const roles = user.roles.map((role) => role.id);
		const currentUser = new CurrentUserBuilder({
			accountId: account.id,
			userId: job.userId,
			schoolId: user.schoolId,
			roles,
		})
			.withExternalSystem(account.systemId)
			.build();
		const payload = new JwtPayloadBuilder(currentUser).build();
		const now = new Date();
		const maxDurationInMs = this.config.jobMaxDurationInMinutes * MILLISECONDS_PER_MINUTE;
		const deadline = job.getDeadline(maxDurationInMs, now);
		const remainingInSeconds = Math.ceil((deadline.getTime() - now.getTime()) / MILLISECONDS_PER_SECOND);
		const lifetimeInSeconds = Math.max(remainingInSeconds, 0) + LIFETIME_MARGIN_IN_SECONDS;

		const token = await this.jwtIssuerService.generateJwtAndAddToWhitelist(payload, lifetimeInSeconds, TOKEN_ID_PREFIX);

		this.logger.info('Board import token created', { jobId: job.id, userId: job.userId });

		return token;
	}

	// Does not reject: the token expires without the removal, and an import that is complete must not fail here.
	public async removeToken(job: BoardImportJob, token: string): Promise<void> {
		try {
			const payload = JwtPayloadVo.fromJwtToken(token);

			await this.jwtWhitelistAdapter.removeFromWhitelist(payload.accountId, payload.jti);
		} catch {
			this.logger.warning('Board import token not removed', { jobId: job.id });
		}
	}
}
