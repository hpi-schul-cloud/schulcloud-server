import { ApiProperty } from '@nestjs/swagger';

export class CommonCartridgeImportBodyParams {
	@ApiProperty({
		type: String,
		format: 'binary',
		required: true,
		description: 'The Common Cartridge file to import.',
	})
	public file!: Express.Multer.File;
}
