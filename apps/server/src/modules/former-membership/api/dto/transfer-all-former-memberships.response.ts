import { ApiProperty } from '@nestjs/swagger';
import { TransferFormerMembershipResponse } from './transfer-former-membership.response';

export class TransferAllFormerMembershipsResponse {
	@ApiProperty()
	total: number;

	@ApiProperty()
	transferred: number;

	@ApiProperty()
	failed: number;

	@ApiProperty({ type: [TransferFormerMembershipResponse] })
	results: TransferFormerMembershipResponse[];

	constructor(props: {
		total: number;
		transferred: number;
		failed: number;
		results: TransferFormerMembershipResponse[];
	}) {
		this.total = props.total;
		this.transferred = props.transferred;
		this.failed = props.failed;
		this.results = props.results;
	}
}
