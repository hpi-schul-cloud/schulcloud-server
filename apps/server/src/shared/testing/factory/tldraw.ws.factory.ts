import { WsSharedDocDo } from '@modules/tldraw/domain/ws-shared-doc.do';
import WebSocket from 'ws';
import { WebSocketReadyStateEnum } from '@shared/testing';

export class TldrawWsFactory {
	public static createWsSharedDocDo(): WsSharedDocDo {
		return { connections: new Map(), destroy: () => {} } as WsSharedDocDo;
	}

	public static createWebsocket(readyState: WebSocketReadyStateEnum): WebSocket {
		return {
			readyState,
			close: () => {},
			send: () => {},
		} as unknown as WebSocket;
	}
}
