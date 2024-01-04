export enum WsCloseCodeEnum {
	WS_CLIENT_BAD_REQUEST_CODE = 4400,
	WS_CLIENT_UNAUTHORISED_CONNECTION_CODE = 4401,
	WS_CLIENT_NOT_FOUND_CODE = 4404,
	WS_CLIENT_ESTABLISHING_CONNECTION_CODE = 4500,
}
export enum WsCloseMessageEnum {
	WS_CLIENT_BAD_REQUEST_MESSAGE = 'Document name is mandatory in url or Tldraw Tool is turned off.',
	WS_CLIENT_UNAUTHORISED_CONNECTION_MESSAGE = "Unauthorised connection - you don't have permission to this drawing.",
	WS_CLIENT_NOT_FOUND_MESSAGE = 'Drawing not found.',
	WS_CLIENT_ESTABLISHING_CONNECTION_MESSAGE = 'Unable to establish websocket connection. Try again later.',
}
