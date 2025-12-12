import { RuntimeConfigDefault } from './domain/runtime-config-value.do';

const RuntimeConfigDefaults: RuntimeConfigDefault[] = [
	{
		key: 'FEATURE_COLUMN_BOARD_SOCKET_ENABLED',
		type: 'boolean',
		description: 'enables the websocket API for the column board feature.',
		value: true,
	},
];

export default RuntimeConfigDefaults;
