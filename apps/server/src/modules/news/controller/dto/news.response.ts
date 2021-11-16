import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/controller';
import { NewsTargetModel } from '@shared/domain';
import { SchoolInfoResponse } from './school-info.response';
import { TargetInfoResponse } from './target-info.response';
import { UserInfoResponse } from './user-info.response';

const NEWS_SOURCES = ['internal', 'rss'] as const;
const TARGET_MODEL_VALUES = Object.values(NewsTargetModel);

type SourceType = typeof NEWS_SOURCES[number];
export class NewsResponse {
	constructor({
		id,
		title,
		content,
		displayAt,
		source,
		sourceDescription,
		targetModel,
		targetId,
		target,
		school,
		creator,
		updater,
		createdAt,
		updatedAt,
		permissions,
	}: NewsResponse) {
		this.id = id;
		this.title = title;
		this.content = content;
		this.displayAt = displayAt;
		this.source = source;
		this.sourceDescription = sourceDescription;
		this.targetModel = targetModel;
		this.targetId = targetId;
		this.target = target;
		this.school = school;
		this.creator = creator;
		this.updater = updater;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.permissions = permissions;
	}

	@ApiProperty({
		description: 'The id of the News entity',
		pattern: '[a-f0-9]{24}',
	})
	id: string;

	@ApiProperty({
		description: 'Title of the News entity',
	})
	title: string;

	@ApiProperty({
		description: 'Content of the News entity',
	})
	content: string;

	@ApiProperty({
		description: 'The point in time from when the News entity schould be displayed',
	})
	displayAt: Date;

	@ApiPropertyOptional({
		type: 'string',
		enum: NEWS_SOURCES,
		description: 'The type of source of the News entity',
	})
	source?: SourceType;

	@ApiPropertyOptional({
		description: 'The source description of the News entity',
	})
	sourceDescription?: string;

	@ApiProperty({
		enum: TARGET_MODEL_VALUES,
		enumName: 'NewsTargetModel',
		description: 'Target model to which the News entity is related',
	})
	targetModel: string;

	@ApiProperty({
		pattern: '[a-f0-9]{24}',
		description: 'Specific target id to which the News entity is related',
	})
	targetId: string;

	@ApiProperty({
		description: 'The target object with id and name, could be the school, team, or course name',
	})
	target: TargetInfoResponse;

	@ApiProperty({
		description: 'The School ownership',
	})
	school: SchoolInfoResponse;

	@ApiProperty({
		description: 'Reference to the User that created the News entity',
	})
	creator: UserInfoResponse;

	@ApiPropertyOptional({
		description: 'Reference to the User that updated the News entity',
	})
	updater?: UserInfoResponse;

	@ApiProperty({
		description: 'The creation timestamp',
	})
	createdAt: Date;

	@ApiProperty({
		description: 'The update timestamp',
	})
	updatedAt: Date;

	@ApiProperty({
		description: 'List of permissions the current user has for the News entity',
	})
	permissions: string[];
}

export class NewsListResponse extends PaginationResponse<NewsResponse[]> {
	constructor(data: NewsResponse[], total: number, skip?: number, limit?: number) {
		super(total, skip, limit);
		this.data = data;
	}

	@ApiProperty({ type: [NewsResponse] })
	data: NewsResponse[];
}
