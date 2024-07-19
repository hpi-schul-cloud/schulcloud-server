import { InputFormat } from '@shared/domain/types';
import { ColumnResponse, LinkContentBody, RichTextContentBody } from '../controller/dto';
import { createLoadtestClient } from './loadtestClientFactory';

// const TARGET = 'https://main.dbc.dbildungscloud.dev';
const TARGET = 'http://localhost:4450';

describe('Board Collaboration Load Test', () => {
	const getToken = (): string => {
		// eslint-disable-next-line no-process-env
		const { token } = process.env;
		if (token === undefined) {
			throw new Error('No token found in environment');
		}
		return token;
	};

	// const configureSocket = (ctx: {}) => {
	// 	if (ctx.vars.target === undefined) {
	// 		// eslint-disable-next-line no-process-env
	// 		ctx.vars.target = process.env.target ? process.env.target : 'http://localhost:4450';
	// 	}

	// 	ctx.vars.target = ctx.vars.target.replace(/\/$/, '');
	// 	ctx.vars.api = ctx.vars.target;
	// 	ctx.vars.web = ctx.vars.target;
	// 	if (/localhost/i.test(ctx.vars.target)) {
	// 		ctx.vars.api = ctx.vars.target.replace('4450', '3030');
	// 		ctx.vars.web = ctx.vars.target.replace('4450', '4000');
	// 	}
	// };

	// const selectCourse = async (ctx) => {
	// 	const response = await fetch(`${ctx.vars.api}/api/v3/courses`, {
	// 		method: "GET",
	// 		credentials: "include",
	// 		headers: {
	// 			"Content-Type": "application/json",
	// 			accept: "application/json",
	// 			Authorization: `Bearer ${getToken()}`,
	// 		},
	// 	});
	// 	const body = await response.json();
	// 	if (body.data.length === 0) {
	// 		throw new Error("No courses found for user");
	// 	}
	// 	const course = body.data[0];
	// 	return course;
	// };

	// const createBoard = async (ctx, course) => {
	// 	console.log(course.title);
	// 	const boardTitle = `${new Date()
	// 		.toISOString()
	// 		.replace(/T/, " ")
	// 		.replace(/(\d\d:\d\d).*$/, "$1")} - Lasttest`;
	// 	const response = await fetch(`${ctx.vars.api}/api/v3/boards`, {
	// 		method: "POST",
	// 		credentials: "include",
	// 		headers: {
	// 			"Content-Type": "application/json",
	// 			accept: "application/json",
	// 			Authorization: `Bearer ${getToken()}`,
	// 		},
	// 		body: JSON.stringify({
	// 			title: boardTitle,
	// 			parentId: course.id,
	// 			parentType: "course",
	// 			layout: "columns",
	// 		}),
	// 	});
	// 	const body = await response.json();
	// 	ctx.vars.board_id = body.id;
	// };

	async function sleep(ms: number) {
		// eslint-disable-next-line no-promise-executor-return
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// async function showBoardlink(ctx) {
	// 	console.log(`${ctx.vars.web}/rooms/${ctx.vars.board_id}/board\n\n`);
	// 	await sleep(1000);
	// }

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

	let columnCount = 0;

	const createColumnContent = async (socket: ReturnType<typeof createLoadtestClient>, column: ColumnResponse) => {
		const card = await socket.createCard({ columnId: column.id });
		await socket.fetchCard({ cardIds: [card.id] });
		await sleep(1000);
		await socket.updateCardTitle({ cardId: card.id, newTitle: 'Hello World' });
		await sleep(1000);
		await socket.createAndUpdateLinkElement(card.id, randomLink());
		await sleep(1000);
		const card2 = await socket.createCard({ columnId: column.id });
		await socket.fetchCard({ cardIds: [card2.id] });

		await socket.updateCardTitle({ cardId: card2.id, newTitle: 'Something' });
		await sleep(1000);
		await sleep(1000);
		await socket.createAndUpdateTextElement(card2.id, randomRichContentBody());
		await sleep(1000);
		await socket.createAndUpdateTextElement(card2.id, randomRichContentBody());
		await sleep(1000);
		await socket.createAndUpdateTextElement(card2.id, randomRichContentBody());
		await sleep(1000);

		// if (Math.random() > 0.9) {
		// 	const from = Math.floor(Math.random() * columnCount);
		// 	const to = Math.floor(Math.random() * columnCount);
		// 	if (from !== to) {
		// 		await socket.moveColumn(column.id, from, to);
		// 	}
		// }
	};

	const paintAColumn = async (target: string, boardId: string) => {
		const socket = createLoadtestClient(target, boardId, getToken());
		const column = await socket.createColumn();
		columnCount += 1;
		const columnNumber = columnCount;
		await socket.updateColumnTitle({ columnId: column.id, newTitle: `${columnNumber}. Spalte` });
		for (let i = 0; i < 3; i += 1) {
			// eslint-disable-next-line no-await-in-loop
			await createColumnContent(socket, column);
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
	};

	const setup = async (target: string, clientCount: number) => {
		// configureSocket(ctx);
		// const course = await selectCourse(ctx);
		// await createBoard(ctx, course);
		const boardId = '6698fa3b097743c2498aa813';
		// await showBoardlink(ctx);

		const socket = createLoadtestClient(target, boardId, getToken());
		await sleep(2000);
		await socket.deleteAllColumns();
		await sleep(3000);

		const promises = Array(clientCount)
			.fill(1)
			.map(() => paintAColumn(target, boardId));

		await Promise.all(promises);
	};

	it('should run a basic load test', async () => {
		// setup({ vars: { target: "https://main.dbc.dbildungscloud.dev", clients: 2 } });
		await setup('http://localhost:4450', 30);
	}, 600000);
});

// [x] refactor to typescript and move to server
// [x] add fetchCard
// [x] add pauses to scenarios
// [x] fix frontend richtext
// [x] fancy typing feature for richtext
// [ ] failure handling
// [/] refactor clientFunctions to use request-parameters
// [ ] define multi-board-scenarios
// [ ] extract board generators
// [ ] evaluate using test factories
// [ ] fix moveCard
// [x] add delete methods
// [ ] failure reporting
// [ ] timeout reporting
// [x] add deleteAllColumns

// [ ] think of way to persist test-results (including grafana-charts)
//   [ ] json-file of results including scenariosettings (clientCount etc., urls, ...)
