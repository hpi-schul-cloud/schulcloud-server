import { RuntimeConfigDefault } from '@infra/runtime-config';

const RuntimeConfigDefaults: RuntimeConfigDefault[] = [
	{
		key: 'DASHBOARD_ANNOUNCEMENT_ENABLED',
		type: 'boolean',
		value: true,
		description:
			'Aktiviert ("AN") oder deaktiviert ("AUS") das Banner auf dem Dashboard für die unten definierten Rollen',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_FOR_ROLES',
		type: 'string',
		value: 'admin,teacher,student,external-person',
		description:
			'Zeigt das Banner den hier eingetragenen Rollen an (Nutze eine mit Komma getrennte Liste, um mehrere Rollen einzutragen: "admin", "teacher", "student", "external-person" - all = "admin,teacher,student,external-person").',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_DE',
		type: 'string',
		value: 'Standard Ankündigungstext',
		description: 'Bannertext Deutsche Version.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_EN',
		type: 'string',
		value: 'Standard announcement text',
		description: 'Bannertext Englische Version.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_ES',
		type: 'string',
		value: 'Texto de anuncio predeterminado',
		description: 'Bannertext Spanische Version.',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_UK',
		type: 'string',
		value: 'Стандартний текст оголошення',
		description: 'Bannertext Ukrainische Version.',
	},
];

export default RuntimeConfigDefaults;
