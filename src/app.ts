import express, {
	type Application,
	type Request,
	type Response,
} from "express";

import cookiePaeser from "cookie-parser";
import cors from "cors";
import globalErrorHandler from "./middleware/globalErrorHandler";
import logger from "./middleware/logger";
import { authRoute } from "./modules/auth/auth.route";
import { profileRoute } from "./modules/profile/profile.route";
import { userRouter } from "./modules/user/user.route";

const app: Application = express();

const corsOptions = {
	// origin: ["http://localhost:3000", "https://example.com"],
	origin: "http://localhost:3000",
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(cookiePaeser());
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use("/api/v1/users", userRouter);

app.use("/api/v1/profiles", profileRoute);

app.use("/api/v1/auth", authRoute);

// Root Route
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		success: true,
		messages: "Server runnig successfully",
		data: {
			status: "ok",
			database: "connected",
			version: "1.0.0.0",
		},
	});
});

// Global Error Handling Middleware
app.use(globalErrorHandler);

export default app;
