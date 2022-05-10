import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ForbiddenOperationError } from '@shared/common';
import { Actions, EntityId, ICurrentUser, LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { AccountService } from '@src/modules/authentication/services/account.service';
import { AuthorizationService } from '@src/modules/authorization';
import { AccountResponse, ChangeLanguageParams } from '../controller/dto';
import { IUserConfig } from '../interfaces';
import { AccountResponseMapper } from '../mapper/account-response.mapper';

@Injectable()
export class UserUC {
	constructor(
		private readonly userRepo: UserRepo,
		private readonly permissionService: PermissionService,
		private readonly configService: ConfigService<IUserConfig, true>,
		private readonly authorizationService: AuthorizationService,
		private readonly accountService: AccountService
	) {}

	async me(userId: EntityId): Promise<[User, string[]]> {
		const user = await this.userRepo.findById(userId, true);
		const permissions = this.permissionService.resolvePermissions(user);

		return [user, permissions];
	}

	private checkAvaibleLanguages(settedLanguage: LanguageType): void | Error {
		if (!this.configService.get<string[]>('AVAILABLE_LANGUAGES').includes(settedLanguage)) {
			throw new BadRequestException('Language is not activated.');
		}
	}

	async patchLanguage(userId: EntityId, params: ChangeLanguageParams): Promise<boolean> {
		this.checkAvaibleLanguages(params.language);
		const user = await this.userRepo.findById(userId);
		user.language = params.language;
		await this.userRepo.save(user);

		return true;
	}

	/**
	 * This method processes the GET request on the user/:id/account endpoint from the user controller
	 * @param currentUser the request user
	 * @param id the request parameter
	 * @throws {ForbiddenOperationError}
	 * @throws {NotImplementedException}
	 * @throws {EntityNotFoundError}
	 */
	async findAccountByUserId(currentUser: ICurrentUser, id: string): Promise<AccountResponse | null> {
		const executingUser = await this.userRepo.findById(currentUser.userId, true);
		const targetUser = await this.userRepo.findById(id, true);

		const permission = this.authorizationService.hasPermission(executingUser, targetUser, Actions.read);

		if (!permission) {
			throw new ForbiddenOperationError('Current user is not authorized to search for accounts by user id.');
		}

		const account = await this.accountService.findByUserId(id);
		if (!account) {
			return null;
		}
		return AccountResponseMapper.mapToResponse(account);
	}
}
