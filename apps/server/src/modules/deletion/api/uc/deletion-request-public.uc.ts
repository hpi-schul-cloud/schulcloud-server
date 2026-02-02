import { LegacyLogger } from '@core/logger';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountService } from '@modules/account';
import { UserService } from '@modules/user';

import { DeletionConfig } from '../../deletion.config';
import { DeletionRequestService } from '../../domain/service';
import { DeletionRequestBodyParams, DeletionRequestResponse } from '../controller/dto';
import { DomainName } from '../../domain/types';
import { ICurrentUser } from '@infra/auth-guard';
import { Permission } from '@shared/domain/interface';
import { AuthorizationService } from '@modules/authorization';

@Injectable()
export class DeletionRequestPublicUc {
	constructor(
		private readonly configService: ConfigService<DeletionConfig, true>,
		private readonly deletionRequestService: DeletionRequestService,
		private readonly logger: LegacyLogger,
		private readonly accountService: AccountService,
		private readonly userService: UserService,
		private readonly authService: AuthorizationService
	) {
		this.logger.setContext(DeletionRequestPublicUc.name);
	}

	public async createUserDeletionRequest(
		currentUser: ICurrentUser,
		deletionRequest: DeletionRequestBodyParams
	): Promise<DeletionRequestResponse> {
		this.logger.debug({ action: 'createDeletionRequestAsUser', deletionRequest, userId: currentUser.userId });
		const user = await this.authService.getUserWithPermissions(currentUser.userId);

		this.authService.checkAllPermissions(user, [Permission.STUDENT_DELETE, Permission.TEACHER_DELETE]);

		if (deletionRequest.targetRef.domain !== DomainName.USER) {
			throw new BadRequestException('Can only request deletion for users');
		}

		const targetUser = await this.userService.findById(deletionRequest.targetRef.id);

		if (!targetUser) {
			throw new NotFoundException('Target user not found');
		}

		if (targetUser.schoolId !== user.school.id) {
			throw new ForbiddenException('Cannot request deletion for user from different school');
		}

		const minutes = deletionRequest.deleteAfterMinutes ?? 0;
		const deleteAfter = new Date();
		deleteAfter.setMinutes(deleteAfter.getMinutes() + minutes);

		const result: DeletionRequestResponse = await this.deletionRequestService.createDeletionRequest(
			deletionRequest.targetRef.id,
			deletionRequest.targetRef.domain,
			deleteAfter
		);

		await this.accountService.deactivateAccount(deletionRequest.targetRef.id, new Date());

		return result;
	}
}
