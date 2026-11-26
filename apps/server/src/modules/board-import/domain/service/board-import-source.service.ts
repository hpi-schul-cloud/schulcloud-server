import { Inject, Injectable } from '@nestjs/common';
import { isIP } from 'node:net';
import { BOARD_IMPORT_SOURCE_CONFIG_TOKEN, BoardImportSourceConfig } from '../../board-import.config';
import { BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException } from '../error';
import { type BoardImportSource, BoardImportSourceType } from '../type';

const SUBDOMAIN_PREFIX = '*.';

@Injectable()
export class BoardImportSourceService {
	constructor(@Inject(BOARD_IMPORT_SOURCE_CONFIG_TOKEN) private readonly config: BoardImportSourceConfig) {}

	public resolveSource(link: string): BoardImportSource {
		const host = this.getHost(link);
		const boardHostsBySourceType: Record<BoardImportSourceType, string[]> = {
			[BoardImportSourceType.TASKCARDS]: this.config.taskcardsBoardHosts,
		};

		const sourceType = Object.values(BoardImportSourceType).find((type) =>
			boardHostsBySourceType[type].some((entry) => this.isHostInEntry(host, entry))
		);
		if (!sourceType) {
			throw new BoardImportSourceUnknownLoggableException();
		}

		const source: BoardImportSource = { type: sourceType, link };

		return source;
	}

	private getHost(link: string): string {
		if (!URL.canParse(link)) {
			throw new BoardImportLinkInvalidLoggableException();
		}

		// The URL parser makes the host lowercase and converts each numeric form of an IPv4 address to the dotted form.
		const url = new URL(link);
		const host = url.hostname.replace(/\.$/, '');
		const hasCredentials = url.username !== '' || url.password !== '';
		const isIpAddress = host.startsWith('[') || isIP(host) !== 0;

		if (url.protocol !== 'https:' || hasCredentials || url.port !== '' || isIpAddress) {
			throw new BoardImportLinkInvalidLoggableException();
		}

		return host;
	}

	private isHostInEntry(host: string, entry: string): boolean {
		if (entry.startsWith(SUBDOMAIN_PREFIX)) {
			const domainSuffix = entry.slice(1);
			const isSubdomain = host.endsWith(domainSuffix);

			return isSubdomain;
		}

		const isSameHost = host === entry;

		return isSameHost;
	}
}
