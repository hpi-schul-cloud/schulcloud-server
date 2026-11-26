export interface TaskcardsLink {
	boardId: string;
	token?: string;
	baseUrl: string;
}

const BOARD_ID_PATTERN = /\/board\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?=[/?#]|$)/i;
const TOKEN_PARAM = 'token';
// The host without "www" answers each request with a redirect to the host with "www".
const HOST_WITHOUT_API = 'taskcards.de';
const API_HOST = 'www.taskcards.de';

// TaskCards puts the route of the app into the fragment: https://www.taskcards.de/#/board/<id>?token=<token>
export const parseTaskcardsLink = (link: string): TaskcardsLink | undefined => {
	if (!URL.canParse(link)) {
		return undefined;
	}

	const url = new URL(link);
	const fragment = url.hash.slice(1);
	const [fragmentPath, fragmentQuery = ''] = fragment.split('?', 2);
	const boardId = BOARD_ID_PATTERN.exec(url.pathname)?.[1] ?? BOARD_ID_PATTERN.exec(fragmentPath)?.[1];

	if (boardId === undefined) {
		return undefined;
	}

	const token = url.searchParams.get(TOKEN_PARAM) || new URLSearchParams(fragmentQuery).get(TOKEN_PARAM) || undefined;
	const host = url.host === HOST_WITHOUT_API ? API_HOST : url.host;
	const taskcardsLink: TaskcardsLink = { boardId, token, baseUrl: `https://${host}` };

	return taskcardsLink;
};
