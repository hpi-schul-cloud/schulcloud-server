import { ConnectedLoggable } from './connected.loggable';

describe(ConnectedLoggable.name, () => {
	it('uses a readable message when Valkey emits no connection payload', () => {
		const loggable = new ConnectedLoggable(undefined);

		expect(loggable.getLogMessage()).toEqual({ message: 'Connected to Valkey' });
	});

	it('serializes a connection payload when one is provided', () => {
		const loggable = new ConnectedLoggable({ host: 'valkey', port: 6379 });

		expect(loggable.getLogMessage()).toEqual({ message: '{"host":"valkey","port":6379}' });
	});
});
