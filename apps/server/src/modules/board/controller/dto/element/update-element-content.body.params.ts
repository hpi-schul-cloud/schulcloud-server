import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import { InputFormat } from '@shared/domain/types';
import { Type } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ContentElementType } from '../../../domain/types';

abstract class ElementContentBody {
	@IsEnum(ContentElementType)
	@ApiProperty({
		enum: ContentElementType,
		description: 'the type of the updated element',
		enumName: 'ContentElementType',
	})
	public type!: ContentElementType;
}

export class FileContentBody {
	@IsString()
	@ApiProperty({})
	public caption!: string;

	@IsString()
	@ApiProperty({})
	public alternativeText!: string;
}

export class FileElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.FILE })
	public type!: ContentElementType.FILE;

	@ValidateNested()
	@ApiProperty()
	public content!: FileContentBody;
}

export class LinkContentBody {
	@IsString()
	@ApiProperty({})
	public url!: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	public title?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	public description?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	public imageUrl?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	public previewImageId?: string;

	@IsString()
	@IsOptional()
	@ApiProperty({})
	public originalImageUrl?: string;
}

export class LinkElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.LINK })
	public type!: ContentElementType.LINK;

	@ValidateNested()
	@ApiProperty({})
	public content!: LinkContentBody;
}

export class DrawingContentBody {
	@IsString()
	@ApiProperty()
	public description!: string;
}

export class DrawingElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.DRAWING })
	public type!: ContentElementType.DRAWING;

	@ValidateNested()
	@ApiProperty()
	public content!: DrawingContentBody;
}

export class RichTextContentBody {
	@IsString()
	@ApiProperty()
	public text!: string;

	@IsEnum(InputFormat)
	@ApiProperty()
	public inputFormat!: InputFormat;
}

export class RichTextElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.RICH_TEXT })
	public type!: ContentElementType.RICH_TEXT;

	@ValidateNested()
	@ApiProperty()
	public content!: RichTextContentBody;
}

export class ExternalToolContentBody {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	public contextExternalToolId?: string;
}

export class ExternalToolElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.EXTERNAL_TOOL })
	public type!: ContentElementType.EXTERNAL_TOOL;

	@ValidateNested()
	@ApiProperty()
	public content!: ExternalToolContentBody;
}

export class VideoConferenceContentBody {
	@IsString()
	@ApiProperty()
	public title!: string;
}

export class VideoConferenceElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.VIDEO_CONFERENCE })
	public type!: ContentElementType.VIDEO_CONFERENCE;

	@ValidateNested()
	@ApiProperty()
	public content!: VideoConferenceContentBody;
}

export class FileFolderContentBody {
	@IsString()
	@ApiProperty()
	public title!: string;
}

export class FileFolderElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.FILE_FOLDER })
	public type!: ContentElementType.FILE_FOLDER;

	@ValidateNested()
	@ApiProperty()
	public content!: FileFolderContentBody;
}

export class H5pContentBody {
	@IsMongoId()
	@IsOptional()
	@ApiPropertyOptional()
	public contentId?: string;
}

export class H5pElementContentBody extends ElementContentBody {
	@ApiProperty({ type: () => ContentElementType.H5P })
	public type!: ContentElementType.H5P;

	@ValidateNested()
	@ApiProperty()
	public content!: H5pContentBody;
}

export type AnyElementContentBody =
	| FileContentBody
	| DrawingContentBody
	| LinkContentBody
	| RichTextContentBody
	| ExternalToolContentBody
	| VideoConferenceContentBody
	| FileFolderContentBody
	| H5pContentBody;

export class UpdateElementContentBodyParams {
	@ValidateNested()
	@Type(() => ElementContentBody, {
		discriminator: {
			property: 'type',
			subTypes: [
				{ value: FileElementContentBody, name: ContentElementType.FILE },
				{ value: LinkElementContentBody, name: ContentElementType.LINK },
				{ value: RichTextElementContentBody, name: ContentElementType.RICH_TEXT },
				{ value: ExternalToolElementContentBody, name: ContentElementType.EXTERNAL_TOOL },
				{ value: DrawingElementContentBody, name: ContentElementType.DRAWING },
				{ value: VideoConferenceElementContentBody, name: ContentElementType.VIDEO_CONFERENCE },
				{ value: FileFolderElementContentBody, name: ContentElementType.FILE_FOLDER },
				{ value: H5pElementContentBody, name: ContentElementType.H5P },
			],
		},
		keepDiscriminatorProperty: true,
	})
	@ApiProperty({
		oneOf: [
			{ $ref: getSchemaPath(FileElementContentBody) },
			{ $ref: getSchemaPath(LinkElementContentBody) },
			{ $ref: getSchemaPath(RichTextElementContentBody) },
			{ $ref: getSchemaPath(ExternalToolElementContentBody) },
			{ $ref: getSchemaPath(DrawingElementContentBody) },
			{ $ref: getSchemaPath(VideoConferenceElementContentBody) },
			{ $ref: getSchemaPath(FileFolderElementContentBody) },
			{ $ref: getSchemaPath(H5pElementContentBody) },
		],
	})
	public data!:
		| FileElementContentBody
		| LinkElementContentBody
		| RichTextElementContentBody
		| ExternalToolElementContentBody
		| DrawingElementContentBody
		| VideoConferenceElementContentBody
		| FileFolderElementContentBody
		| H5pElementContentBody;
}
