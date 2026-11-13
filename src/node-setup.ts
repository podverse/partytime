import pino from "pino";

import config from "./config";
import { setPartytimeLogger } from "./logger";
import { setConfiguredMaxFeedBodyBytes } from "./settings";

const pinoLogger = pino({ level: config.logLevel });
setPartytimeLogger(pinoLogger);
setConfiguredMaxFeedBodyBytes(config.parserMaxFeedBodyBytes);
pinoLogger.debug(config);
