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
			'Zeigt das Banner den hier eingetragenen Rollen an (Nutze eine mit Komma getrennte Liste, um mehrere Rollen einzutragen z.B. "administrator,teacher,student,external-person").',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_DE',
		type: 'string',
		value:
			'Sichern Sie Ihre Inhalte der Cloud und nutzen Sie auch die neue Funktion zum Export von Kursen. <a href="https://dbildungscloud.de/help/confluence/485132545" target="_blank" rel="noopener noreferrer">Weitere Informationen und Hilfestellungen sind hier zu finden.</a>',
		description: 'Bannertext Deutsche Version (unterstützt HTML)',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_EN',
		type: 'string',
		value:
			'Back up your cloud content and also use the new function for exporting courses. <a href="https://dbildungscloud.de/help/confluence/485132545" target="_blank" rel="noopener noreferrer">More information and instructions can be found here.</a>',
		description: 'Bannertext Englische Version (unterstützt HTML).',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_ES',
		type: 'string',
		value:
			'Haga una copia de seguridad de sus contenidos de la nube y utilice también la nueva función para exportar cursos. <a href="https://dbildungscloud.de/help/confluence/485132545" target="_blank" rel="noopener noreferrer">Más información y ayuda disponible aquí</a>',
		description: 'Bannertext Spanische Version (unterstützt HTML).',
	},
	{
		key: 'DASHBOARD_ANNOUNCEMENT_TEXT_UK',
		type: 'string',
		value:
			'Зробіть резервну копію вашого контенту в хмарі та використовуйте також нову функцію для експорту курсів. <a href="https://dbildungscloud.de/help/confluence/485132545" target="_blank" rel="noopener noreferrer">Додаткову інформацію та допомогу можна знайти тут.</a>',
		description: 'Bannertext Ukrainische Version (unterstützt HTML).',
	},
];

export default RuntimeConfigDefaults;
