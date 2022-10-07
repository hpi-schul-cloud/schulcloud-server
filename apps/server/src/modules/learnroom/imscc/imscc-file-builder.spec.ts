import { ImsccFileBuilder } from '@src/modules/learnroom/imscc/imscc-file-builder';

describe('ImsccFileBuilder', () => {
	let builder: ImsccFileBuilder;

	beforeAll(() => {
		builder = new ImsccFileBuilder();
	});

	describe('addTitle', () => {
		it('should return builder', () => {
			expect(builder.addTitle('Placeholder')).toEqual<ImsccFileBuilder>(builder);
		});
	});

	describe('build', () => {
		it('should return a readable stream', () => {
			builder.addTitle('Placeholder');

			expect(builder.build()).toBeDefined();
		});
	});
});
