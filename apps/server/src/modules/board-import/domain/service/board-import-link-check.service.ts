import { Injectable } from '@nestjs/common';
import dns from 'node:dns';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason, type BoardImportSourceType } from '../type';
import { isPublicAddress } from './board-import-public-address';
import { BoardImportSourceService } from './board-import-source.service';

export interface BoardImportCheckedAddress {
	address: string;
	family: 4 | 6;
}

const HOST_NOT_FOUND_CODE = 'ENOTFOUND';

// The check for each request to a source. See ADR 0013.
@Injectable()
export class BoardImportLinkCheckService {
	constructor(private readonly boardImportSourceService: BoardImportSourceService) {}

	// Returns the address that the request must connect to. Another lookup can give an address that is not checked.
	public async check(url: URL, sourceType: BoardImportSourceType): Promise<BoardImportCheckedAddress> {
		this.checkHost(url, sourceType);

		const addresses = await this.lookup(url.hostname);
		const checkedAddresses = addresses.filter((entry): entry is BoardImportCheckedAddress =>
			this.isCheckedAddress(entry)
		);
		const [firstAddress] = checkedAddresses;

		if (!firstAddress || checkedAddresses.length !== addresses.length) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		}

		return firstAddress;
	}

	private checkHost(url: URL, sourceType: BoardImportSourceType): void {
		let urlSourceType: BoardImportSourceType;
		try {
			urlSourceType = this.boardImportSourceService.resolveSource(url.href).type;
		} catch {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		}

		if (urlSourceType !== sourceType) {
			throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
		}
	}

	private async lookup(host: string): Promise<dns.LookupAddress[]> {
		try {
			const addresses = await dns.promises.lookup(host, { all: true });

			return addresses;
		} catch (error) {
			if (this.hasCode(error, HOST_NOT_FOUND_CODE)) {
				throw new BoardImportJobRejectedError(BoardImportJobLogReason.SOURCE_LINK_REJECTED);
			}
			// The lookup error is not passed on, because its message contains the host of the link.
			throw new Error('Lookup of the source host failed');
		}
	}

	private isCheckedAddress(entry: dns.LookupAddress): boolean {
		const isCheckedAddress = (entry.family === 4 || entry.family === 6) && isPublicAddress(entry.address, entry.family);

		return isCheckedAddress;
	}

	private hasCode(error: unknown, code: string): boolean {
		const hasCode = error instanceof Error && 'code' in error && error.code === code;

		return hasCode;
	}
}
