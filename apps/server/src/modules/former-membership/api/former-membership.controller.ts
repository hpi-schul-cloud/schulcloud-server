import { CurrentUser, ICurrentUser, JwtAuthentication } from '@infra/auth-guard';
import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestTimeout } from '@shared/common/decorators/timeout.decorator';
import {
	FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_ALL_API_KEY,
	FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_API_KEY,
} from '../timeout.config';
import {
	FormerMembershipListItemResponse,
	FormerMembershipUrlParams,
	ReclaimFormerMembershipResponse,
	TransferAllFormerMembershipsResponse,
	TransferFormerMembershipResponse,
} from './dto';
import { FormerMembershipUc } from './former-membership.uc';

@ApiTags('FormerMembership')
@JwtAuthentication()
@Controller('users/me/former-memberships')
export class FormerMembershipController {
	constructor(private readonly formerMembershipUc: FormerMembershipUc) {}

	@ApiOperation({
		summary: "List the current user's own former course/room memberships available to transfer.",
	})
	@ApiResponse({ status: 200, type: [FormerMembershipListItemResponse] })
	@Get()
	public async list(@CurrentUser() currentUser: ICurrentUser): Promise<FormerMembershipListItemResponse[]> {
		return await this.formerMembershipUc.list(currentUser.userId);
	}

	@ApiOperation({
		summary: "Transfer a former course/room membership directly into the current user's new school.",
	})
	@ApiResponse({ status: 200, type: TransferFormerMembershipResponse })
	@RequestTimeout(FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_API_KEY)
	@Post(':type/:refId/transfer')
	public async transfer(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: FormerMembershipUrlParams
	): Promise<TransferFormerMembershipResponse> {
		return await this.formerMembershipUc.transfer(currentUser.userId, params.type, params.refId);
	}

	@ApiOperation({
		summary: 'Reclaim/Transfer (backward compatibility alias).',
	})
	@ApiResponse({ status: 200, type: ReclaimFormerMembershipResponse })
	@RequestTimeout(FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_API_KEY)
	@Post(':type/:refId/reclaim')
	public async reclaim(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: FormerMembershipUrlParams
	): Promise<ReclaimFormerMembershipResponse> {
		const result = await this.formerMembershipUc.transfer(currentUser.userId, params.type, params.refId);
		return new ReclaimFormerMembershipResponse(result.success, result.newRefId);
	}

	@ApiOperation({
		summary: "Bulk transfer all former course and room memberships into the current user's new school.",
	})
	@ApiResponse({ status: 200, type: TransferAllFormerMembershipsResponse })
	@RequestTimeout(FORMER_MEMBERSHIP_INCOMING_REQUEST_TIMEOUT_TRANSFER_ALL_API_KEY)
	@Post('transfer-all')
	public async transferAll(@CurrentUser() currentUser: ICurrentUser): Promise<TransferAllFormerMembershipsResponse> {
		return await this.formerMembershipUc.transferAll(currentUser.userId);
	}

	@ApiOperation({
		summary: 'Discard a former course/room membership of the current user without transferring.',
	})
	@ApiResponse({ status: 204 })
	@Delete(':type/:refId')
	@HttpCode(204)
	public async discard(
		@CurrentUser() currentUser: ICurrentUser,
		@Param() params: FormerMembershipUrlParams
	): Promise<void> {
		await this.formerMembershipUc.discard(currentUser.userId, params.type, params.refId);
	}
}
