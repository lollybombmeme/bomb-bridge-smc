import { Database } from "./db";
import hardhat from 'hardhat';

interface Web3UtilsInitial {
    delayStep?: number, //Delay time in milliseconds
    redeploy?: boolean // Redeploy flag
}

export const delay = async (millisecond: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, millisecond));
};

export class Web3Utils {
    delayStep: number
    redeploy: boolean
    db: Database

    constructor({ delayStep, redeploy }: Web3UtilsInitial = { delayStep: 1000 }) {
        this.delayStep = delayStep ?? 1000;
        this.redeploy = redeploy ?? true;
        this.db = new Database()
    }

    /**
     * Get saved smart contract from db
     * @param smcName Name of smart contract
     * @param network Block chain network
     * @returns Saved Smart contract
     */
    getContract = async (smcName: string, network: string = hardhat.network.name) => {
        let address = this.db.read(network, smcName);
        if (!address) throw new Error("Contract not found")
        return await hardhat.ethers.getContractAt(smcName, address);
    }

    /**
     * Deploy smart contract in current network then save to db
     * @param smcName Name of smart contract
     * @param args Arguments in constructor of smart contract
     * @returns Deployed smart contract
     */
    deployContract = async (smcName: string, args: any[]) => {
        // Get current network name
        let network = hardhat.network.name
        let address = this.db.read(network, smcName);
        // Return deployed contract if this.redeploy = false
        if (address && !this.redeploy) return await hardhat.ethers.getContractAt(smcName, address)

        console.log(`Deploy ${smcName} on ${network}...`)
        await delay(this.delayStep)
        const smcFactory = await hardhat.ethers.getContractFactory(smcName);
        const smc = await smcFactory.deploy(...args);

        const smcAddress = await smc.getAddress()
        this.db.write(network, smcName, smcAddress)
        console.log(`Deploy success ${smcName}, address: ${smcAddress}`)
        return smc
    }
}

