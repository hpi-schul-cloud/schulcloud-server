import archiver from 'archiver';
import { Readable } from 'node:stream';
import { ZipSizeCalculator, type ZipEntrySize } from './zip-size.calculator';

const buildArchive = async (entries: ZipEntrySize[]): Promise<number> => {
	const archive = archiver('zip', { store: true, zlib: { level: 0 } });
	let size = 0;
	archive.on('data', (chunk: Buffer) => {
		size += chunk.length;
	});
	const finished = new Promise<void>((resolve, reject) => {
		archive.on('end', () => resolve());
		archive.on('error', reject);
	});

	entries.forEach((entry) => archive.append(Readable.from([Buffer.alloc(entry.size)]), { name: entry.name }));
	await archive.finalize();
	await finished;

	return size;
};

describe(ZipSizeCalculator.name, () => {
	describe('storedArchiveSize', () => {
		describe.each([
			[[{ name: 'a.txt', size: 0 }]],
			[
				[
					{ name: 'a.txt', size: 1234 },
					{ name: 'folder/b bin.dat', size: 100000 },
				],
			],
			[
				[
					{ name: 'ümläüte/Grüße.txt', size: 7 },
					{ name: 'INFO.txt', size: 4096 },
				],
			],
		])('when entries are %j', (entries: ZipEntrySize[]) => {
			it('should match the size archiver actually produces', async () => {
				const actual = await buildArchive(entries);

				expect(ZipSizeCalculator.storedArchiveSize(entries)).toBe(actual);
			});
		});

		describe('when an entry requires zip64', () => {
			it('should return undefined', () => {
				const result = ZipSizeCalculator.storedArchiveSize([{ name: 'huge.bin', size: 0x100000000 }]);

				expect(result).toBeUndefined();
			});
		});

		describe('when the entry count exceeds the zip limit', () => {
			it('should return undefined', () => {
				const entries = Array.from({ length: 0x10000 }, (_, index) => {
					return { name: `${index}.txt`, size: 1 };
				});

				const result = ZipSizeCalculator.storedArchiveSize(entries);

				expect(result).toBeUndefined();
			});
		});
	});
});
