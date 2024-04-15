import {
	InlineResponse2001,
	InlineResponse2003Data,
	InlineResponse2004Data,
	InlineResponse200Data,
} from '../generated-etherpad-api-client';
import { AuthorId, GroupId, PadId, SessionId } from '../interface';

export class EtherpadResponseMapper {
	static mapToSessionResponse(session: InlineResponse2004Data | undefined): SessionId {
		if (session && 'sessionID' in session && session.sessionID) {
			const sessionId = session.sessionID;

			return sessionId;
		}

		throw new Error('Session could not be created');
	}

	static mapToAuthorResponse(author: InlineResponse2003Data | undefined): AuthorId {
		if (author && 'authorID' in author && author.authorID) {
			const authorId = author.authorID;

			return authorId;
		}

		throw new Error('Author could not be created');
	}

	static mapToGroupResponse(group: InlineResponse200Data | undefined): GroupId {
		if (group && 'groupID' in group && group.groupID) {
			const groupId = group.groupID;

			return groupId;
		}

		throw new Error('Group could not be created');
	}

	static mapToPadResponse(pad: InlineResponse2001 | undefined): PadId {
		// InlineResponse2001 has wrong type definition
		if (pad && 'padID' in pad && pad.padID) {
			const padId = pad.padID as string;

			return padId;
		}

		throw new Error('Pad could not be created');
	}
}
