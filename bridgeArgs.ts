import * as dotenv from "dotenv";
dotenv.config();

const bridgeArgs = [
    process.env.TOKEN_ADDRESS,
    process.env.SINGER_ADDRESSES!.split(","),
    process.env.POOL_ADDRESS,
    process.env.THRESHOLD,
];

export default bridgeArgs;
