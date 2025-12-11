import { RuntimeConfigDefault } from './domain/runtime-config-value.do';

const RuntimeConfigDefaults: RuntimeConfigDefault[] = [
	{
		key: 'GLOBAL_ANNOUNCEMENT_TEXT',
		type: 'string',
		description: 'a translation key that the frontend can use to identify a text to be shown',
		value: '',
	},
	{
		key: 'GLOBAL_ANNOUNCEMENT_ROLES',
		type: 'string',
		description: 'the roles that should see the announcement, comma separated.',
		value: 'teacher,administrator',
	},
];

export default RuntimeConfigDefaults;
