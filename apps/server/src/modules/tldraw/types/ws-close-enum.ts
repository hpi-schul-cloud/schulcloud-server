export enum WsCloseCode {
	BAD_REQUEST = 4400,
	UNAUTHORIZED = 4401,
	NOT_FOUND = 4404,
	NOT_ACCEPTABLE = 4406,
	INTERNAL_SERVER_ERROR = 4500,
}
export enum WsCloseMessage {
	FEATURE_DISABLED = 'Tldraw feature is disabled.',
	BAD_REQUEST = 'Room name param not found in url.',
	UNAUTHORIZED = "You don't have permission to this drawing.",
	NOT_FOUND = 'Drawing not found.',
	NOT_ACCEPTABLE = 'Could not get document, still finalizing or not yet loaded.',
	INTERNAL_SERVER_ERROR = 'Unable to establish websocket connection.',
}
