import { ImsccFileBuilder } from '@src/modules/learnroom/imscc/imscc-file-builder';
import { Readable } from 'stream';
import AdmZip from 'adm-zip';

describe('ImsccFileBuilder', () => {
	let builder: ImsccFileBuilder;

	beforeEach(() => {
		builder = new ImsccFileBuilder();
	});

	describe('addTitle', () => {
		it('should return builder', async () => {
			const title = 'Placeholder Title';

			expect(builder.addTitle(title)).toEqual(builder);

			const file = await builder.build();
			const buffers = [] as unknown[];
			// eslint-disable-next-line no-restricted-syntax
			for await (const chunk of file) {
				buffers.push(chunk);
			}
			const zip = new AdmZip(Buffer.concat(buffers as Uint8Array[]));
			const manifest = zip.getEntry('imsmanifest.xml');

			expect(manifest?.getData().toString()).toContain(title);
		});
	});

	describe('build', () => {
		it('should return a readable stream', async () => {
			builder.addTitle('Placeholder');

			await expect(builder.build()).resolves.toBeInstanceOf(Readable);
		});
	});
});
