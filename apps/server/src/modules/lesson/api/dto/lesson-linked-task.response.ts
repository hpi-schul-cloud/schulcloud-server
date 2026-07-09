import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types';

export class LessonLinkedTaskResponse {
	@ApiProperty()
	readonly name: string;

	@ApiProperty()
	readonly description: string;

	@ApiProperty({ enum: InputFormat })
	readonly descriptionInputFormat: InputFormat;

	@ApiProperty({ type: Date, nullable: true })
	availableDate?: Date;

	@ApiProperty({ type: Date, nullable: true })
	dueDate?: Date;

	@ApiProperty()
	readonly private: boolean = true;

	@ApiProperty({ nullable: true })
	readonly publicSubmissions?: boolean;

	@ApiProperty({ nullable: true })
	readonly teamSubmissions?: boolean;

	@ApiProperty({ nullable: true })
	readonly creator?: string;

	@ApiProperty({ nullable: true })
	readonly courseId?: string;

	@ApiProperty({ type: [String] })
	readonly submissionIds: string[] = [];

	@ApiProperty({ type: [String] })
	readonly finishedIds: string[] = [];

	constructor(props: Readonly<LessonLinkedTaskResponse>) {
		this.name = props.name;
		this.description = props.description;
		this.descriptionInputFormat = props.descriptionInputFormat;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		this.private = props.private;
		this.creator = props.creator;
		this.courseId = props.courseId;
		this.publicSubmissions = props.publicSubmissions;
		this.teamSubmissions = props.teamSubmissions;
		this.submissionIds = props.submissionIds;
		this.finishedIds = props.finishedIds;
	}
}
