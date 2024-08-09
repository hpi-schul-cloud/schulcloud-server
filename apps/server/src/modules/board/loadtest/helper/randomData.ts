import { LinkContentBody } from '../../controller/dto';

export const getRandomLink = (): LinkContentBody => {
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

export const getRandomRichContentBody = (): string => {
	const texts = [
		'Es ist nicht wichtig, wie groß der erste Schritt ist, sondern in welche Richtung er geht.',
		'Niemand weiß, was er kann, bis er es probiert hat.',
		'Was Du mit guter Laune tust, fällt Dir nicht schwer.',
		'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.',
		'Damit Ihr indess erkennt, woher dieser ganze Irrthum gekommen ist, und weshalb man die Lust anklagt und den Schmerz lobet, so will ich Euch Alles eröffnen und auseinander setzen, was jener Begründer der Wahrheit und gleichsam Baumeister des glücklichen Lebens selbst darüber gesagt hat.',
	];
	return texts[Math.floor(Math.random() * texts.length)];
};

export const getRandomCardTitle = (): string => {
	const titles = ['Sonstiges', 'Einleitung', 'Beispiele', 'Geschichte', 'Meeresbewohner'];
	return titles[Math.floor(Math.random() * titles.length)];
};
