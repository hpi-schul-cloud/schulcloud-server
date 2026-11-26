import { Inject, Injectable } from '@nestjs/common';
import { BOARD_IMPORT_SOURCE_CONFIG_TOKEN, BoardImportSourceConfig } from '../../board-import.config';
import { BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException } from '../error';
import { type BoardImportSource, BoardImportSourceType } from '../type';

const SUBDOMAIN_PREFIX = '*.';
// Labels are not empty and the last label starts with a letter. Thus IP addresses, empty labels and a dot at the end
// do not match.
const HOST_NAME_PATTERN = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]([a-z0-9-]*[a-z0-9])?$/;

@Injectable()
export class BoardImportSourceService {
	constructor(@Inject(BOARD_IMPORT_SOURCE_CONFIG_TOKEN) private readonly config: BoardImportSourceConfig) {}

	public resolveSource(link: string): BoardImportSource {
		const { host, normalizedLink } = this.parseLink(link);
		const boardHostsBySourceType: Record<BoardImportSourceType, string[]> = {
			[BoardImportSourceType.TASKCARDS]: this.config.taskcardsBoardHosts,
		};

		const sourceType = Object.values(BoardImportSourceType).find((type) =>
			boardHostsBySourceType[type].some((entry) => this.isHostInEntry(host, entry))
		);
		if (!sourceType) {
			throw new BoardImportSourceUnknownLoggableException();
		}

		// The normalized link has only one reading, so a later request cannot go to another host than the checked one.
		const source: BoardImportSource = { type: sourceType, link: normalizedLink };

		return source;
	}

	private parseLink(link: string): { host: string; normalizedLink: string } {
		if (!URL.canParse(link)) {
			throw new BoardImportLinkInvalidLoggableException();
		}

		// The URL parser makes the host lowercase and converts each numeric form of an IPv4 address to the dotted form.
		const url = new URL(link);
		const host = url.hostname;
		const hasCredentials = url.username !== '' || url.password !== '';
		const isHostName = HOST_NAME_PATTERN.test(host);

		if (url.protocol !== 'https:' || hasCredentials || url.port !== '' || !isHostName) {
			throw new BoardImportLinkInvalidLoggableException();
		}

		const result = { host, normalizedLink: url.href };

		return result;
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
