export enum WsCloseCodeEnum {
	WS_CLIENT_BAD_REQUEST_CODE = 4400,
	WS_CLIENT_UNAUTHORISED_CONNECTION_CODE = 4401,
}
export enum WsCloseMessageEnum {
	WS_CLIENT_BAD_REQUEST_MESSAGE = 'Document name is mandatory in url or Tldraw Tool is turned off.',
	WS_CLIENT_UNAUTHORISED_CONNECTION_LACK_PERMISSION_MESSAGE = "Unauthorised connection - you don't have permission to this drawing.",
	WS_CLIENT_UNAUTHORISED_CONNECTION_JWT_NOT_PROVIDED_MESSAGE = "Unauthorised connection - you don't have permission to this drawing.",
}
