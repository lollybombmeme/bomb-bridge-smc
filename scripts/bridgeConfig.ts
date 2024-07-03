import { Web3Utils } from "../utils";
import { network } from "hardhat";
import config from "../config";

const { getContract } = new Web3Utils();

const main = async () => {
    // Get Token smart contract
    const Token = await getContract("Token");
    // Get Bridge smart contract
    const Bridge = await getContract("MemBridge");

    // CHAIN_IDS: [sourceChainId, destinationChainId]
    // If source chain, need pool authorize for transfer token by bridge smc for lock-release mechanism
    // If destination chain, need mint-burn role for mint-burn mechanism
    if (config.CHAIN_IDS[0] === network.config.chainId) {
        // Get Bridge Pool smart contract
        const BridgePool = await getContract("BridgePool");

        // Bridge pool allow bridge smc to get token from pool
        await BridgePool.authorizeBridge(Bridge.target);
    } else {
        // If destination chain allow mint-burn role for bridge smc
        await Token.grantRole(await Token.MINTER_ROLE(), Bridge.target);
        await Token.grantRole(await Token.BURNER_ROLE(), Bridge.target);
    }

    // Approve chain id for bridge
    const destChainId =
        network.config.chainId == config.CHAIN_IDS[0]
            ? config.CHAIN_IDS[1]
            : config.CHAIN_IDS[0];

    // If source chain - allow to bridge to destination chain and vice versa
    const approveChainIdTx = await Bridge.setChainIdSupport(destChainId, true);
    console.log(
        "Config approve chainId success, txHash:: ",
        approveChainIdTx.hash
    );
};

main()
    .then(() => {
        console.info("Bridge config step success");
    })
    .catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
