import { ApiProperty } from '@nestjs/swagger';
import { FormerMembershipType } from '../../repo/entity/school-material-transfer-request.entity';

export { FormerMembershipType };

export class FormerMembershipListItemResponse {
	@ApiProperty({ enum: ['course', 'room'], enumName: 'FormerMembershipType' })
	type: FormerMembershipType;

	@ApiProperty()
	refId: string;

	@ApiProperty()
	name: string;

	@ApiProperty()
	schoolId: string;

	@ApiProperty({ required: false })
	schoolName?: string;

	constructor(props: {
		type: FormerMembershipType;
		refId: string;
		name: string;
		schoolId: string;
		schoolName?: string;
	}) {
		this.type = props.type;
		this.refId = props.refId;
		this.name = props.name;
		this.schoolId = props.schoolId;
		this.schoolName = props.schoolName;
	}
}
