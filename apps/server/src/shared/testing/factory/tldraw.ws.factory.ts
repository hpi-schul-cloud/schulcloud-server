import { WsSharedDocDo } from '@src/modules/tldraw/domain/ws-shared-doc.do';
import WebSocket from 'ws';

export class TldrawWsFactory {
	public static createWsSharedDocDo(): WsSharedDocDo {
		return { conns: new Map(), destroy: () => {} } as WsSharedDocDo;
	}

	public static createWebsocket(readyState: number): WebSocket {
		return { readyState, close: () => {} } as WebSocket;
	}
}
