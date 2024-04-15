import {
	EtherpadAuthorPadsResponse,
	EtherpadAuthorResponse,
	EtherpadAuthorSessionsResponse,
	EtherpadAuthorsOfPadResponse,
	EtherpadDeleteResponse,
	EtherpadGroupResponse,
} from './response';

export interface EthepadApiInterface {
	createOrGetAuthor(authorMapper: string, name: string): Promise<EtherpadAuthorResponse>;

	createOrGetGroup(groupMapper: string): Promise<EtherpadGroupResponse>;

	listPadsOfAuthor(authorID: string): Promise<EtherpadAuthorPadsResponse>;

	listAuthorsOfPad(padID: string): Promise<EtherpadAuthorsOfPadResponse>;

	listSessionsOfAuthor(authorID: string): Promise<EtherpadAuthorSessionsResponse>;

	deleteSession(sessionID: string): Promise<EtherpadDeleteResponse>;

	deletePad(padID: string): Promise<EtherpadDeleteResponse>;
}
