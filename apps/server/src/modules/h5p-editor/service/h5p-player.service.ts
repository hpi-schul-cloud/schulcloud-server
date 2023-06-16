import { H5PConfig, H5PPlayer, UrlGenerator, IPlayerModel } from '@lumieducation/h5p-server';

import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';

const renderer = (model: IPlayerModel): string => `<!doctype html>
<html class="h5p-iframe">
<head>
    <meta charset="utf-8">
    ${model.styles.map((style) => `<link rel="stylesheet" href="${style}"/>`).join('\n    ')}
    ${model.scripts.map((script) => `<script src="${script}"></script>`).join('\n    ')}

    <script>
        window.H5PIntegration = ${JSON.stringify(model.integration, null, 2)};
    </script>
</head>
<body>
    <div class="h5p-content" data-content-id="${model.contentId as string}"></div>

	<script>
		(() => {
			let iframeIdentifier = undefined;

			function postSize(identifier) {
				const height = H5P?.jQuery(".h5p-content")[0].clientHeight;

				if (iframeIdentifier && height) {
					window.parent.postMessage(JSON.stringify({
						identifier: identifier,
						size: {
							x: document.body.scrollWidth,
							y: height
						}
					}), '*');
				}
			}

			window.addEventListener("message", (event) => {
				try {
					const message = JSON.parse(event.data);
					
					if (message.function === "getSize") {
						iframeIdentifier = message.identifier;
						postSize(iframeIdentifier);
					}
				} catch (error) {
					// Ignore message
				}
			})

			H5P.externalDispatcher.on("initialized", function() {
				H5P.instances[0].on('resize', function() {
					postSize(iframeIdentifier);
				});
			});
		})();
	</script>
</body>
</html>`;

export const H5PPlayerService = {
	provide: H5PPlayer,
	inject: [ContentStorage, LibraryStorage],
	useFactory: (contentStorage: ContentStorage, libraryStorage: LibraryStorage) => {
		const config: H5PConfig = new H5PConfig(undefined, {
			baseUrl: '/api/v3/h5p-editor',
			contentUserStateSaveInterval: false,
		});

		const urlGenerator = new UrlGenerator(config);

		const h5pPlayer = new H5PPlayer(
			libraryStorage,
			contentStorage,
			config,
			undefined,
			urlGenerator,
			undefined,
			undefined,
			undefined
		);

		h5pPlayer.setRenderer(renderer);

		return h5pPlayer;
	},
};
