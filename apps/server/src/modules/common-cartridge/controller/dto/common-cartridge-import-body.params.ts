import { ApiProperty } from '@nestjs/swagger';

export class CommonCartridgeImportBodyParams {
	@ApiProperty({
		type: 'string',
		format: 'binary',
		description: 'The Common Cartridge file to import.',
	})
	public file!: Express.Multer.File;
}
