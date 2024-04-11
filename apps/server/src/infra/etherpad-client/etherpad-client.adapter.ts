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

	async getOrCreateSession(authorId: EntityId, parentId: EntityId) {
		const session = this.sessionApi.createSessionUsingGET(parentId, authorId);

		return session;
	}

	async getOrCreateCollaborativeTextEditor(userId: EntityId, parentId: EntityId) {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const groupID = groupResponse.data.data?.groupID;

		if (groupID) {
			const padId = await this.hasPad(groupID, parentId);
			if (padId) {
				return padId;
			}
			const padResponse = await this.groupApi.createGroupPadUsingGET(groupID, parentId);
			const padID = padResponse.data.data;

			return padID;
		}
	}

	private async hasPad(groupID: string, parentId: string) {
		const pads = await this.groupApi.listPadsUsingGET(groupID);
		const pad = pads.data.data?.padIDs?.find((padId: string) => padId.includes(`${groupID}$${parentId}`));

		return pad;
	}
}
