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

	async getOrCreateSession(authorId: EntityId, groupId: EntityId, validUntil: number = 2220) {
		const session = await this.sessionApi.createSessionUsingGET(groupId, authorId, (Date.now() + validUntil) as any);

		if (!session.data.data?.sessionID) {
			throw new Error('Could not create session');
		}

		return session.data.data?.sessionID;
	}

	async getOrCreateCollaborativeTextEditor(userId: EntityId, parentId: EntityId) {
		const groupResponse = await this.groupApi.createGroupIfNotExistsForUsingGET(parentId);
		const groupId = groupResponse.data.data?.groupID;

		if (groupId) {
			const padID = await this.hasPad(groupId, parentId);
			if (padID) {
				return { padId: padID, groupId };
			}
			const padResponse = await this.groupApi.createGroupPadUsingGET(groupId, parentId);
			const padId = (padResponse.data.data as { padID?: string })?.padID || '';

			return { padId, groupId };
		}
		throw new Error('Could not create group');
	}

	private async hasPad(groupID: string, parentId: string) {
		const pads = await this.groupApi.listPadsUsingGET(groupID);
		const pad = pads.data.data?.padIDs?.find((padId: string) => padId.includes(`${groupID}$${parentId}`));

		return pad;
	}
}
