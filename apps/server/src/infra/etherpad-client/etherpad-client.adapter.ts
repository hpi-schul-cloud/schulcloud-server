import { Injectable } from '@nestjs/common';
import { EntityId } from '@shared/domain/types';
import { Logger } from '@src/core/logger';
import { AuthorApi, GroupApi, SessionApi } from './generated-etherpad-api-client/api';

@Injectable()
export class EtherpadClientAdapter {
	constructor(
		private readonly groupApi: GroupApi,
		private readonly sessionApi: SessionApi,
		private readonly authorApi: AuthorApi,
		private logger: Logger
	) {
		this.logger.setContext(EtherpadClientAdapter.name);
	}

	async getOrCreateAuthor(userId: EntityId) {
		const response = await this.authorApi.createAuthorIfNotExistsForUsingGET(userId);

		const authorID = response.data.data?.authorID;

		if (!authorID) {
			throw new Error('Could not create author');
		}

		return authorID;
	}

	async getOrCreateSession(authorId: EntityId, parentId: EntityId, sessionCookieExpireDate: Date): Promise<string> {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const session = await this.sessionApi.createSessionUsingGET(
			groupResponse.data.data?.groupID,
			authorId,
			sessionCookieExpireDate.getTime().toString()
		);

		return session.data.data?.sessionID as unknown as string;
	}

	async listSessionsOfAuthor(authorId: string) {
		const response = await this.authorApi.listSessionsOfAuthorUsingGET(authorId);

		return Object.keys(response.data.data as object);
	}

	async getOrCreateCollaborativeTextEditor(userId: EntityId, parentId: EntityId): Promise<string | undefined> {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const groupId = groupResponse.data.data?.groupID;

		if (groupId) {
			let padId = await this.hasPad(groupId, parentId);

			if (padId) {
				return padId;
			}

			const padResponse = await this.groupApi.createGroupPadUsingGET(groupId, parentId);
			padId = padResponse.data.data as unknown as string;

			return padId;
		}

		return undefined;
	}

	private async hasPad(groupID: string, parentId: string) {
		const pads = await this.groupApi.listPadsUsingGET(groupID);
		const pad = pads.data.data?.padIDs?.find((padId: string) => padId.includes(`${groupID}$${parentId}`));

		return pad;
	}
}
