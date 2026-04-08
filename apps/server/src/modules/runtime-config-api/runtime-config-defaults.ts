import { RuntimeConfigDefault } from '@infra/runtime-config';

const RuntimeConfigDefaults: RuntimeConfigDefault[] = [
	{
		key: 'DASHBOARD_ANNOUNCEMENT_ENABLED',
		type: 'boolean',
		value: true,
		description:
			'Configures whether the dashboard announcement should be displayed or not. Useful for separating preparation and activation/deactivation of the announcement.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_DE',
		type: 'string',
		value: 'Standard Ankündigungstext',
		description: 'Announcement text in German.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_EN',
		type: 'string',
		value: 'Standard announcement text',
		description: 'Announcement text in English.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_ES',
		type: 'string',
		value: 'Texto de anuncio predeterminado',
		description: 'Announcement text in Spanish.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_UK',
		type: 'string',
		value: 'Стандартний текст оголошення',
		description: 'Announcement text in Ukrainian.',
	},
];

export default RuntimeConfigDefaults;
