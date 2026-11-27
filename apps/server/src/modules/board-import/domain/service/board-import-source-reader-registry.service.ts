import { Injectable } from '@nestjs/common';
import { type BoardImportSourceReader } from '../interface';

@Injectable()
export class BoardImportSourceReaderRegistryService {
	private readonly readers = new Map<string, BoardImportSourceReader>();

	public registerReader(reader: BoardImportSourceReader): void {
		if (this.readers.has(reader.type)) {
			throw new Error(`The reader of the import source "${reader.type}" is registered already`);
		}

		this.readers.set(reader.type, reader);
	}

	public findByType(type: string): BoardImportSourceReader | undefined {
		const reader = this.readers.get(type);

		return reader;
	}
}
