import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ContentSubElementType } from '@shared/domain';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsString, ValidateNested } from 'class-validator';

export abstract class SubElementContentBody {
	@ApiProperty({
		enum: ContentSubElementType,
		description: 'the type of the updated element',
		enumName: 'ContentSubElementType',
	})
	@IsEnum(ContentSubElementType)
	type!: ContentSubElementType;
}

export class SubmissionContentBody {
	@IsBoolean()
	completed!: boolean;

	// TODO
	@IsString()
	userId!: string;
}

export class SubmissionSubElementContentBody extends SubElementContentBody {
	@ApiProperty({ type: ContentSubElementType.SUBMISSION })
	type!: ContentSubElementType.SUBMISSION;

	@ValidateNested()
	@ApiProperty()
	content!: SubmissionContentBody;
}

export class SubElementContentUpdateBodyParams {
	@ValidateNested()
	@Type(() => SubElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [{ value: SubmissionSubElementContentBody, name: ContentSubElementType.SUBMISSION }],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [{ $ref: getSchemaPath(SubmissionSubElementContentBody) }],
	})
	data!: SubmissionSubElementContentBody;
}
