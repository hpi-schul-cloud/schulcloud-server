import { Injectable } from '@nestjs/common';
import { BoardImportLinkInvalidLoggableException, BoardImportSourceUnknownLoggableException } from '../error';
import { type BoardImportSource } from '../type';
import { isHostName, SUBDOMAIN_PREFIX } from './board-import-host-name';
import { BoardImportSourceRegistryService } from './board-import-source-registry.service';

@Injectable()
export class BoardImportSourceService {
	constructor(private readonly boardImportSourceRegistryService: BoardImportSourceRegistryService) {}

	public resolveSource(link: string): BoardImportSource {
		const parsedLink = this.parseLink(link);
		if (!parsedLink) {
			throw new BoardImportLinkInvalidLoggableException();
		}

		const sourceType = this.findSourceType(parsedLink.host);
		if (!sourceType) {
			throw new BoardImportSourceUnknownLoggableException();
		}

		// A request of the worker can go to another host of the source. isLinkOfSource checks each of these requests.
		const source: BoardImportSource = { type: sourceType, link: parsedLink.normalizedLink };

		return source;
	}

	// Applies the same rules as resolveSource, for a URL that the worker gets from a source, for example a redirect.
	public isLinkOfSource(link: string, sourceType: string): boolean {
		const parsedLink = this.parseLink(link);
		const boardHosts = this.boardImportSourceRegistryService.findByType(sourceType)?.boardHosts ?? [];
		const isLinkOfSource =
			parsedLink !== undefined && boardHosts.some((entry) => this.isHostInEntry(parsedLink.host, entry));

		return isLinkOfSource;
	}

	public getSwitchKey(sourceType: string): string {
		const definition = this.boardImportSourceRegistryService.findByType(sourceType);
		if (!definition) {
			throw new BoardImportSourceUnknownLoggableException();
		}

		return definition.switchKey;
	}

	private findSourceType(host: string): string | undefined {
		const definition = this.boardImportSourceRegistryService
			.getAll()
			.find((source) => source.boardHosts.some((entry) => this.isHostInEntry(host, entry)));

		return definition?.type;
	}

	private parseLink(link: string): { host: string; normalizedLink: string } | undefined {
		if (!URL.canParse(link)) {
			return undefined;
		}

		// The URL parser makes the host lowercase and converts each numeric form of an IPv4 address to the dotted form.
		const url = new URL(link);
		const host = url.hostname;
		const hasCredentials = url.username !== '' || url.password !== '';

		if (url.protocol !== 'https:' || hasCredentials || url.port !== '' || !isHostName(host)) {
			return undefined;
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
