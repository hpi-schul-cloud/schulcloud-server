// This is a workaround for the missing types for jsdom, because the types are not included in the package itself.
// This is a declaration file for the JSDOM class, which is used in the CommonCartridgeManifestParser.
// Currently the JSDOM types are bit buggy and don't work properly with our project setup.

declare module 'jsdom' {
	class JSDOM {
		constructor(html: string, options?: Record<string, unknown>);

		window: Window;
	}
}
