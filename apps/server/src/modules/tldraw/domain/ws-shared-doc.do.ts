import WebSocket from 'ws';
import { Doc } from 'yjs';
import { Awareness } from 'y-protocols/awareness';

export class WsSharedDocDo extends Doc {
	public name: string;

	public connections: Map<WebSocket, Set<number>>;

	public awareness: Awareness;

	public awarenessChannel: string;

	public isFinalizing = false;

	constructor(name: string, gcEnabled = true) {
		super({ gc: gcEnabled });
		this.name = name;
		this.connections = new Map();
		this.awareness = new Awareness(this);
		this.awareness.setLocalState(null);
		this.awarenessChannel = `${name}-awareness`;
	}
}
