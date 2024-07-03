import * as dotenv from 'dotenv'

dotenv.config()

interface Config {
    SIGNER_PRIVATE_KEYS: string[],
    DEPLOYER_PRIVATE_KEY: string,
    CHAIN_IDS: number[]
}

const config: Config = {
    SIGNER_PRIVATE_KEYS: process.env.SIGNER_PRIVATE_KEYS!.split(","),
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY!,
    CHAIN_IDS: process.env.CHAIN_IDS!.split(",").map(e => Number(e))
}

export default config