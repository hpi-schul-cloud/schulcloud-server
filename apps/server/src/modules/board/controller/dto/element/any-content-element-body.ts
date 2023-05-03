import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { FileElementContent } from './file-element.response';
import { TextElementContent } from './text-element.response';

export class AnyContentElementBody {
	@ApiProperty({
		oneOf: [{ $ref: getSchemaPath(TextElementContent) }, { $ref: getSchemaPath(FileElementContent) }],
	})
	content!: TextElementContent | FileElementContent;
}
