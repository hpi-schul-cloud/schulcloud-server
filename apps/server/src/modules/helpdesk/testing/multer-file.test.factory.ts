import { createMock } from '@golevelup/ts-jest';
import { Readable } from 'stream';

export const multerFileFactory: {
	create: (props?: Partial<Express.Multer.File>) => Express.Multer.File;
} = {
	create: (props?: Partial<Express.Multer.File>): Express.Multer.File => {
		return {
			buffer: Buffer.from('test file content'),
			originalname: 'test-file.txt',
			mimetype: 'text/plain',
			fieldname: 'file',
			encoding: '7bit',
			size: 1024,
			stream: createMock<Readable>(),
			destination: '',
			filename: '',
			path: '',
			...props,
		};
	},
};
