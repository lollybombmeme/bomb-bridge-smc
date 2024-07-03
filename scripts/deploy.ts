import { Web3Utils } from "../utils";
import hardhat, { network } from "hardhat";
import config from "../config";

const { deployContract } = new Web3Utils({ redeploy: true });

const main = async () => {
    const tokenName: string = "MyToken";
    const tokenSymbol: string = "MTK";

    // Default value for signature thresh hold =  round up (number of signers / 2)
    const signatureThreshHold = Math.ceil(
        config.SIGNER_PRIVATE_KEYS.length / 2
    );

    // Get deployer wallet
    const [deployer] = await hardhat.ethers.getSigners();

    // Get wallet addresses of signers by their private keys
    const signerAddresses = config.SIGNER_PRIVATE_KEYS.map((privateKey) => {
        return new hardhat.ethers.Wallet(privateKey).address;
    });

    // Deploy Token smart contract
    const Token = await deployContract("Token", [tokenName, tokenSymbol]);

    // CHAIN_IDS: [sourceChainId, destinationChainId]
    // If source chain, need to deploy pool smc for lock-release mechanism
    // If destination chain, don't need to deploy pool because using mint-burn mechanism
    let bridgePoolAddress = hardhat.ethers.ZeroAddress;
    if (config.CHAIN_IDS[0] === network.config.chainId) {
        // Deploy BridgePool smart contract
        const BridgePool = await deployContract("BridgePool", [
            Token.target,
            deployer.address,
        ]);
        bridgePoolAddress = await BridgePool.getAddress();
    }

    // Deploy Bridge smart contract
    await deployContract("MemBridge", [
        Token.target,
        signerAddresses,
        bridgePoolAddress,
        signatureThreshHold,
    ]);
};

main().then(() => {
    console.info("Deploy step is complete")
}).catch((error) => {
    console.error(error.message);
    process.exit(1);
});
