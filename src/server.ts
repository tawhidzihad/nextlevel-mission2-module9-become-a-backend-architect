import app from "./app";
import config from "./config";
import { inintDB } from "./db";

const main = async () => {
	inintDB();
	app.listen(config.port, () => {
		console.log(`Express server running at ${config.port}`);
	});
};

main();
