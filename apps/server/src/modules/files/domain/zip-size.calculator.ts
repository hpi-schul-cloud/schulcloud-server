const LOCAL_FILE_HEADER_SIZE = 30;
const DATA_DESCRIPTOR_SIZE = 16;
const CENTRAL_DIRECTORY_HEADER_SIZE = 46;
const END_OF_CENTRAL_DIRECTORY_SIZE = 22;
const ZIP64_SIZE_LIMIT = 0xffffffff;
const MAX_ENTRY_COUNT = 0xffff;

export interface ZipEntrySize {
	name: string;
	size: number;
}

/**
 * Predicts the byte size of an uncompressed (STORE) zip produced by archiver,
 * so the archive can be streamed with a Content-Length header.
 */
export class ZipSizeCalculator {
	/** Archiver appends stream sources with a data descriptor, which adds 16 bytes per entry. */
	public static streamedEntrySize(name: string, size: number): number {
		const nameLength = Buffer.byteLength(name, 'utf8');

		return (
			LOCAL_FILE_HEADER_SIZE + nameLength + size + DATA_DESCRIPTOR_SIZE + CENTRAL_DIRECTORY_HEADER_SIZE + nameLength
		);
	}

	/** Returns undefined when zip64 headers would be required, because their size is not predictable here. */
	public static storedArchiveSize(entries: ZipEntrySize[]): number | undefined {
		if (entries.length > MAX_ENTRY_COUNT) {
			return undefined;
		}

		let total = END_OF_CENTRAL_DIRECTORY_SIZE;

		for (const entry of entries) {
			if (entry.size > ZIP64_SIZE_LIMIT) {
				return undefined;
			}
			total += this.streamedEntrySize(entry.name, entry.size);
		}

		return total > ZIP64_SIZE_LIMIT ? undefined : total;
	}
}
