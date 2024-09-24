import { ApiProperty } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types';

export class TaskResponse {
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

	// @Index()
	// @ManyToOne('Course', { fieldName: 'courseId', nullable: true })
	// course?: Course;

	// @Index()
	// @ManyToOne(() => SchoolEntity, { fieldName: 'schoolId' })
	// school: SchoolEntity;

	// @Index()
	// @ManyToOne('LessonEntity', { fieldName: 'lessonId', nullable: true })
	// lesson?: LessonEntity; // In database exist also null, but it can not set.

	// @OneToMany('Submission', 'task')
	// submissions = new Collection<Submission>(this);

	// @Index()
	// @ManyToMany('User', undefined, { fieldName: 'archived' })
	// finished = new Collection<User>(this);

	constructor(props: Readonly<TaskResponse>) {
		this.name = props.name;
		this.description = props.description;
		this.descriptionInputFormat = props.descriptionInputFormat;
		this.availableDate = props.availableDate;
		this.dueDate = props.dueDate;
		this.private = props.private;
		this.creator = props.creator;
	}
}
