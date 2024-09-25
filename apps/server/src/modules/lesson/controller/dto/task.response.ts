import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types';

export class SlimTaskResponse {
	@ApiProperty()
	public readonly name: string;

	@ApiProperty()
	public readonly description: string;

	@ApiProperty({ enum: InputFormat })
	public readonly descriptionInputFormat: InputFormat;

	@ApiProperty({ type: Date, nullable: true })
	availableDate?: Date;

	@ApiProperty({ type: Date, nullable: true })
	dueDate?: Date;

	@ApiProperty()
	public readonly private: boolean = true;

	@ApiProperty({ nullable: true })
	public readonly publicSubmissions?: boolean;

	@ApiProperty({ nullable: true })
	public readonly teamSubmissions?: boolean;

	@ApiProperty({ nullable: true })
	public readonly creator?: string;

	@ApiProperty({ nullable: true })
	public readonly courseId?: string;

	@ApiProperty({ type: [String] })
	public readonly submissionIds: string[] = [];

	@ApiProperty({ type: [String] })
	public readonly finishedIds: string[] = [];

	constructor(props: Readonly<SlimTaskResponse>) {
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
