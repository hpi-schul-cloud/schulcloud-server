import WebSocket from 'ws';
import { HttpHeaders } from 'aws-sdk/clients/iot';

export class TestConnection {
	public static getWsUrl = (gatewayPort: number): string => {
		const wsUrl = `ws://localhost:${gatewayPort}`;
		return wsUrl;
	};

	public static setupWs = async (wsUrl: string, docName?: string, headers?: HttpHeaders): Promise<WebSocket> => {
		let ws: WebSocket;
		if (docName) {
			ws = new WebSocket(`${wsUrl}/${docName}`, { headers });
		} else {
			ws = new WebSocket(`${wsUrl}`, { headers });
		}
		await new Promise((resolve) => {
			ws.on('open', resolve);
		});

		return ws;
	};
}
