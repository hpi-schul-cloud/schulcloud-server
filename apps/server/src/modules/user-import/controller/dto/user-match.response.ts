import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';
import { MatchCreatorResponse } from './match-creator.response';

export class UserMatchResponse {
	constructor(props: UserMatchResponse) {
		this.userId = props.userId;
		this.loginName = props.loginName;
		this.firstName = props.firstName;
		this.lastName = props.lastName;
		this.matchedBy = props.matchedBy;
	}

	@IsMongoId()
	@ApiProperty({ description: 'local user id' })
	userId: string;

	@ApiProperty({ description: 'login name of local user' })
	loginName: string;

	@ApiProperty({ description: 'firstname of local user' })
	firstName: string;

	@ApiProperty({ description: 'lastname of local user' })
	lastName: string;

	@ApiProperty({
		description: 'match type: admin (manual) or auto (set, when names match exactly for a single user',
		enum: MatchCreatorResponse,
	})
	matchedBy: MatchCreatorResponse;
}
