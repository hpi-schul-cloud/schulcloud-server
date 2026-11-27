import { JwtPayloadVo } from '@infra/auth-guard';
import {
	FileRecordParentType,
	FilesStorageClientAdapter,
	type LinkElementContentBody,
	PreviewStatus,
	StorageLocation,
} from '@infra/common-cartridge-clients';
import { HttpStatus, Injectable } from '@nestjs/common';
import { type EntityId } from '@shared/domain/types';
import { isAxiosError } from 'axios';
import { basename } from 'node:path';
import { BoardImportJobRejectedError } from '../error';
import { BoardImportJobLogReason } from '../type';
import { type BoardImportLinkMetaTags, BoardImportServerClientService } from './board-import-server-client.service';
import { type BoardImportUserSession } from './board-import-user-session';

const PREVIEW_PROTOCOLS = new Set(['http:', 'https:']);
const NO_META_TAGS: BoardImportLinkMetaTags = { title: '', description: '' };
// The link element of the client loads the preview image with the same values.
const IMAGE_REQUEST_HEADERS = { 'User-Agent': 'Embed Request User Agent' };
const IMAGE_FALLBACK_NAME = 'file';
const IMAGE_OUTPUT_FORMAT = 'image/webp';

// Builds the content of a link element with its preview. See ADR 0017.
// The preview is optional: without it, the link element has only the address.
@Injectable()
export class BoardImportLinkPreviewService {
	constructor(
		private readonly filesStorageClient: FilesStorageClientAdapter,
		private readonly serverClient: BoardImportServerClientService
	) {}

	public async buildLinkContent(
		elementId: EntityId,
		url: string,
		session: BoardImportUserSession
	): Promise<LinkElementContentBody['content']> {
		const { title, description, originalImageUrl } = await this.findMetaTags(url, session);
		const imageUrl =
			originalImageUrl === undefined ? undefined : await this.findImageUrl(elementId, originalImageUrl, session);
		const content = { url, title, description, imageUrl: imageUrl ?? '', originalImageUrl: originalImageUrl ?? '' };

		return content;
	}

	private async findMetaTags(url: string, session: BoardImportUserSession): Promise<BoardImportLinkMetaTags> {
		if (!PREVIEW_PROTOCOLS.has(new URL(url).protocol)) {
			return NO_META_TAGS;
		}

		const metaTags = await this.callOptional(() =>
			session.call((token) => this.serverClient.getLinkMetaTags(token, url))
		);

		return metaTags ?? NO_META_TAGS;
	}

	// The file storage loads the image and stores it as a file of the link element.
	private async findImageUrl(
		elementId: EntityId,
		originalImageUrl: string,
		session: BoardImportUserSession
	): Promise<string | undefined> {
		const fileName = basename(new URL(originalImageUrl).pathname) || IMAGE_FALLBACK_NAME;
		const fileRecord = await this.callOptional(() =>
			session.call((token) =>
				this.filesStorageClient.uploadFromUrl(
					token,
					JwtPayloadVo.fromJwtToken(token).schoolId,
					StorageLocation.SCHOOL,
					elementId,
					FileRecordParentType.BOARDNODES,
					{ url: originalImageUrl, fileName, headers: IMAGE_REQUEST_HEADERS }
				)
			)
		);
		if (fileRecord?.previewStatus !== PreviewStatus.PREVIEW_POSSIBLE) {
			return undefined;
		}

		const imageUrl = `${fileRecord.url.replace('download', 'preview')}?outputFormat=${IMAGE_OUTPUT_FORMAT}`;

		return imageUrl;
	}

	// Resolves with undefined when the API rejects the request or does not answer.
	// A 401 is not optional: the attempt has no valid token then, see ADR 0011.
	private async callOptional<T>(request: () => Promise<T>): Promise<T | undefined> {
		try {
			const result = await request();

			return result;
		} catch (error) {
			if (!this.isOptionalFailure(error)) {
				throw error;
			}

			return undefined;
		}
	}

	private isOptionalFailure(error: unknown): boolean {
		// The session reports a repeated 403 with this error.
		if (error instanceof BoardImportJobRejectedError) {
			return error.reason === BoardImportJobLogReason.BOARD_API_FORBIDDEN;
		}

		const isOptionalFailure = isAxiosError(error) && error.response?.status !== HttpStatus.UNAUTHORIZED;

		return isOptionalFailure;
	}
}
