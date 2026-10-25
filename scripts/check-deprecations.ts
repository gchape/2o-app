import { relative } from "node:path";
import { API } from "typescript/unstable/sync";

// tsc reports type errors, but deprecated APIs are suggestion diagnostics.
// Read them from the installed compiler so checks follow our pinned versions.
const cwd = process.cwd();
const api = new API({ cwd });

try {
	using snapshot = api.updateSnapshot({
		openProjects: [`${cwd}/tsconfig.json`],
	});
	const project = snapshot.getProject(`${cwd}/tsconfig.json`);
	if (!project) throw new Error("Unable to load the TypeScript project.");

	const deprecated = project.program
		.getSuggestionDiagnostics()
		.filter(
			(diagnostic) =>
				diagnostic.reportsDeprecated &&
				diagnostic.fileName &&
				!diagnostic.fileName.includes("/node_modules/") &&
				!diagnostic.fileName.endsWith("/routeTree.gen.ts"),
		);

	for (const diagnostic of deprecated) {
		if (!diagnostic.fileName) continue;
		const source = project.program.getSourceFile(diagnostic.fileName);
		const line = source?.text.slice(0, diagnostic.pos).split("\n").length;
		console.error(
			`${relative(cwd, diagnostic.fileName)}:${line ?? "?"}: ${diagnostic.text}`,
		);
	}

	if (deprecated.length > 0) process.exitCode = 1;
	else console.log("No deprecated TypeScript APIs found in project code.");
} finally {
	api.close();
}
