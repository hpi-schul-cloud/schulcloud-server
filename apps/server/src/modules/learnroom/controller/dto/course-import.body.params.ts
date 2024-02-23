import { ApiProperty } from '@nestjs/swagger';

export class CourseImportBodyParams {
	@ApiProperty({
		type: String,
		format: 'binary',
		required: true,
		description: 'The Common Cartridge file to import.',
	})
	file!: Express.Multer.File;
}
