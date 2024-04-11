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

		return authorID;
	}

	async getOrCreateSession(userId: EntityId, parentId: EntityId): Promise<string> {
		const authorId = await this.getOrCreateAuthor(userId);
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const session = await this.sessionApi.createSessionUsingGET(
			groupResponse.data.data?.groupID,
			authorId,
			(Date.now() + 60 * 60 * 1000).toString()
		);

		return session.data.data?.sessionID as unknown as string;
	}

	async getOrCreateCollaborativeTextEditor(userId: EntityId, parentId: EntityId): Promise<string | undefined> {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const groupID = groupResponse.data.data?.groupID;

		if (groupID) {
			const padId = await this.hasPad(groupID, parentId);
			if (padId) {
				return padId;
			}
			const padResponse = await this.groupApi.createGroupPadUsingGET(groupID, parentId);
			const padID = padResponse.data.data as unknown as string;

			return padID;
		}

		return undefined;
	}

	private async hasPad(groupID: string, parentId: string) {
		const pads = await this.groupApi.listPadsUsingGET(groupID);
		const pad = pads.data.data?.padIDs?.find((padId: string) => padId.includes(`${groupID}$${parentId}`));

		return pad;
	}
}
