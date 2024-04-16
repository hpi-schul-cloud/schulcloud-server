import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
import {
	InlineResponse2001,
	InlineResponse2003Data,
	InlineResponse2004Data,
	InlineResponse200Data,
} from '../etherpad-api-client';
import { AuthorId, ErrorType, EtherpadParams, EtherpadResponse, GroupId, PadId, SessionId } from '../interface';
import { EtherpadServerError } from '../loggable';

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

	static mapToError<T extends EtherpadResponse>(axiosResponse: AxiosResponse<T>, payload: EtherpadParams) {
		const response = axiosResponse.data;

		switch (response.code) {
			case 1:
				throw this.handleError<T>(ErrorType.ETHERPAD_SERVER_BAD_REQUEST, payload, response);
			case 2:
				throw this.handleError<T>(ErrorType.ETHERPAD_SERVER_INTERNAL_ERROR, payload, response);
			case 3:
				throw this.handleError<T>(ErrorType.ETHERPAD_SERVER_FUNCTION_NOT_FOUND, payload, response);
			case 4:
				throw this.handleError<T>(ErrorType.ETHERPAD_SERVER_WRONG_API_KEY, payload, response);
			default:
				return response.data as T['data'];
		}
	}

	static handleError<T extends EtherpadResponse>(
		type: ErrorType,
		payload: EtherpadParams,
		response: T | Error
	): EtherpadServerError {
		return new EtherpadServerError(type, payload, ErrorUtils.createHttpExceptionOptions(response.message));
	}
}
