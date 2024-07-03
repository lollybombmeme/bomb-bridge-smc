import * as dotenv from "dotenv";
dotenv.config();

const bridgeArgs = [process.env.TOKEN_ADDRESS, process.env.OWNER_ADDRESS];

export default bridgeArgs;
