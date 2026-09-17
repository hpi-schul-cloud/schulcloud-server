import { Readable } from 'node:stream';
import { FixedSizeStream } from './fixed-size.stream';

const collect = async (stream: Readable): Promise<Buffer> => {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}

	return Buffer.concat(chunks);
};

describe(FixedSizeStream.name, () => {
	describe('when the source delivers the expected size', () => {
		it('should pass the data through unchanged', async () => {
			const stream = new FixedSizeStream(5);
			Readable.from([Buffer.from('hello')]).pipe(stream);

			const result = await collect(stream);

			expect(result.toString()).toBe('hello');
			expect(stream.isExact).toBe(true);
		});
	});

	describe('when the source delivers too few bytes', () => {
		it('should pad with zero bytes', async () => {
			const stream = new FixedSizeStream(8);
			Readable.from([Buffer.from('abc')]).pipe(stream);

			const result = await collect(stream);

			expect(result).toEqual(Buffer.concat([Buffer.from('abc'), Buffer.alloc(5)]));
			expect(stream.isExact).toBe(false);
		});
	});

	describe('when the source delivers too many bytes', () => {
		it('should truncate the data', async () => {
			const stream = new FixedSizeStream(3);
			Readable.from([Buffer.from('abcdef')]).pipe(stream);

			const result = await collect(stream);

			expect(result.toString()).toBe('abc');
			expect(stream.isExact).toBe(false);
		});
	});

	describe('when padding exceeds the internal chunk size', () => {
		it('should still emit the expected size', async () => {
			const expectedSize = 200 * 1024;
			const stream = new FixedSizeStream(expectedSize);
			Readable.from([Buffer.from('a')]).pipe(stream);

			const result = await collect(stream);

			expect(result).toHaveLength(expectedSize);
		});
	});
});
