/* eslint-disable no-await-in-loop */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-process-env */
import { ColumnResponse, LinkContentBody } from '../controller/dto';
import { createLoadtestClient } from './loadtestClientFactory';

type UrlConfiguration = {
	websocket: string;
	api: string;
	web: string;
};

type UserProfile = {
	name: string;
	sleepMs: number;
	maxCards: number;
};

const fastEditor: UserProfile = { name: 'fastEditor', sleepMs: 1000, maxCards: 10 };
const slowEditor: UserProfile = { name: 'slowEditor', sleepMs: 3000, maxCards: 5 };
const viewer: UserProfile = { name: 'viewer', sleepMs: 1000, maxCards: 0 };

const addUsers = (userProfile: UserProfile, count: number) => Array(count).fill(userProfile) as Array<UserProfile>;

const viewersClass = { name: 'viewersClass', users: [...addUsers(fastEditor, 1), ...addUsers(viewer, 30)] };
const collaborativeClass = { name: 'collaborativeClass', users: [...addUsers(slowEditor, 30)] };

describe('Board Collaboration Load Test', () => {
	const getToken = (): string => {
		// eslint-disable-next-line no-process-env
		const { token } = process.env;
		if (token === undefined) {
			throw new Error('No token found in environment');
		}
		return token;
	};

	const getUrlConfiguration = (): UrlConfiguration => {
		const { target } = process.env;
		if (target === undefined || /localhost/.test(target)) {
			return {
				websocket: 'http://localhost:4450',
				api: 'http://localhost:3030',
				web: 'http://localhost:4000',
			};
		}
		return {
			websocket: target,
			api: target,
			web: target,
		};
	};

	const createBoard = async (apiBaseUrl: string, courseId: string) => {
		const boardTitle = `${new Date()
			.toISOString()
			.replace(/T/, ' ')
			.replace(/(\d\d:\d\d).*$/, '$1')} - Lasttest`;

		const response = await fetch(`${apiBaseUrl}/api/v3/boards`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				accept: 'application/json',
				Authorization: `Bearer ${getToken()}`,
			},
			body: JSON.stringify({
				title: boardTitle,
				parentId: courseId,
				parentType: 'course',
				layout: 'columns',
			}),
		});
		const body = (await response.json()) as unknown as { id: string };
		return body.id;
	};

	const createBoards = async (apiBaseUrl: string, courseId: string, amount: number) => {
		const promises = Array(amount)
			.fill(1)
			.map(() => createBoard(apiBaseUrl, courseId));
		const results = await Promise.all(promises);
		return results;
	};

	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	const randomLink = (): LinkContentBody => {
		const links = [
			{ url: 'https://www.google.com', title: 'Google' },
			{ url: 'https://www.zdf.de', title: 'ZDF Mediathek' },
			{ url: 'https://www.tagesschau.de', title: 'Tagesschau' },
			{ url: 'https://www.sueddeutsche.de', title: 'Süddeutsche' },
			{ url: 'https://www.zeit.de', title: 'Die Zeit' },
			{ url: 'https://www.spiegel.de', title: 'Spiegel.de' },
		];
		return links[Math.floor(Math.random() * links.length)];
	};

	const randomRichContentBody = (): string => {
		const texts = [
			'Es ist nicht wichtig, wie groß der erste Schritt ist, sondern in welche Richtung er geht.',
			'Niemand weiß, was er kann, bis er es probiert hat.',
			'Was Du mit guter Laune tust, fällt Dir nicht schwer.',
			'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
			'Damit Ihr indess erkennt, woher dieser ganze Irrthum gekommen ist, und weshalb man die Lust anklagt und den Schmerz lobet, so will ich Euch Alles eröffnen und auseinander setzen, was jener Begründer der Wahrheit und gleichsam Baumeister des glücklichen Lebens selbst darüber gesagt hat.',
		];
		return texts[Math.floor(Math.random() * texts.length)];
	};

	const randomCardTitle = (): string => {
		const titles = ['Sonstiges', 'Einleitung', 'Beispiele', 'Geschichte', 'Meeresbewohner'];
		return titles[Math.floor(Math.random() * titles.length)];
	};

	let columnCount = 0;

	const createRandomCard = async (
		socket: ReturnType<typeof createLoadtestClient>,
		column: ColumnResponse,
		pauseMs = 1000
	) => {
		const card = await socket.createCard({ columnId: column.id });
		await socket.fetchCard({ cardIds: [card.id] });
		await sleep(pauseMs);
		await socket.updateCardTitle({ cardId: card.id, newTitle: randomCardTitle() });
		await sleep(pauseMs);
		for (let i = 0; i < Math.floor(Math.random() * 5); i += 1) {
			if (Math.random() > 0.5) {
				await socket.createAndUpdateLinkElement(card.id, randomLink());
			} else {
				await socket.createAndUpdateTextElement(card.id, randomRichContentBody());
			}
			await sleep(pauseMs);
		}
	};

	const createEditor = async (target: string, boardId: string, userProfile: UserProfile) => {
		const socket = createLoadtestClient(target, boardId, getToken());
		if (userProfile.maxCards > 0) {
			const column = await socket.createColumn();
			columnCount += 1;
			const columnNumber = columnCount;
			await socket.updateColumnTitle({ columnId: column.id, newTitle: `${columnNumber}. Spalte` });

			for (let i = 0; i < userProfile.maxCards; i += 1) {
				await createRandomCard(socket, column, userProfile.sleepMs);
			}
			await socket.updateColumnTitle({ columnId: column.id, newTitle: `${columnNumber}. Spalte (fertig)` });

			const summaryCard = await socket.createCard({ columnId: column.id });
			// await socket.moveCard(column.id, summaryCard.id, socket.getCardPosition(summaryCard.id), 0);
			const responseTimes = socket.getResponseTimes();
			const sum = responseTimes.reduce((all, cur) => all + cur.responseTime, 0);
			await socket.updateCardTitle({
				cardId: summaryCard.id,
				newTitle: `${responseTimes.length} requests (avg response time: ${(sum / responseTimes.length).toFixed(2)} ms)`,
			});
		}
	};

	const runBoardTest = async (boardId: string, configuration: { users: UserProfile[] }, urls: UrlConfiguration) => {
		const fastEditorPromises = configuration.users.map((userProfile: UserProfile) =>
			createEditor(urls.websocket, boardId, userProfile)
		);

		return Promise.all([...fastEditorPromises]);
	};

	const setup = async ({
		courseId,
		configurations,
	}: {
		courseId: string;
		configurations: Array<{ users: UserProfile[] }>;
	}) => {
		const urls = getUrlConfiguration();
		const boardIds = await createBoards(urls.api, courseId, configurations.length);
		const promises = configurations.flatMap((conf, index) => runBoardTest(boardIds[index], conf, urls));
		await Promise.all(promises);
	};

	it('should run a basic load test', async () => {
		await setup({
			courseId: '669a5a36c040408795c74581',
			configurations: [viewersClass, viewersClass, collaborativeClass],
		});
	}, 600000);
});

// to run this test, you need to set the following environment variables:
//   export token={ paste the token of a logged in user here }
//   export target={ paste url of server }
// and you need to update the courseId above

// [x] refactor to typescript and move to server
// [x] add fetchCard
// [x] add pauses to scenarios
// [x] fix frontend richtext
// [x] fancy typing feature for richtext
// [x] define multi-board-scenarios
// [x] fetch cards of other users, too
// [x] implement different types of users
// [ ] failure handling
// [ ] fix problem with connection breakdown
// [ ] fetch cards with debounce
// [/] refactor clientFunctions to use request-parameters
// [/] extract board generators
// [ ] evaluate using test factories
// [ ] fix moveCard
// [x] add delete methods
// [ ] failure reporting
// [ ] timeout reporting
// [x] add deleteAllColumns

// [ ] think of way to persist test-results (including grafana-charts)
//   [ ] json-file of results including scenariosettings (clientCount etc., urls, ...)
