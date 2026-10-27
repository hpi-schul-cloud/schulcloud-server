import { ApiProperty } from '@nestjs/swagger';
import { FormerMembershipType } from '../../repo/entity/school-material-transfer-request.entity';

export class TransferFormerMembershipResponse {
	@ApiProperty()
	success: boolean;

	@ApiProperty({ enum: ['course', 'room'], enumName: 'FormerMembershipType' })
	type: FormerMembershipType;

	@ApiProperty()
	refId: string;

	@ApiProperty({ required: false })
	newRefId?: string;

	@ApiProperty({ required: false })
	error?: string;

	constructor(props: {
		success: boolean;
		type: FormerMembershipType;
		refId: string;
		newRefId?: string;
		error?: string;
	}) {
		this.success = props.success;
		this.type = props.type;
		this.refId = props.refId;
		this.newRefId = props.newRefId;
		this.error = props.error;
	}
}

export class ReclaimFormerMembershipResponse {
	@ApiProperty({ description: 'Whether the membership was restored or transferred.' })
	reclaimed: boolean;

	@ApiProperty({ required: false })
	newRefId?: string;

	constructor(reclaimed: boolean, newRefId?: string) {
		this.reclaimed = reclaimed;
		this.newRefId = newRefId;
	}
}
