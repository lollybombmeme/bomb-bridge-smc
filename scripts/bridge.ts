import { Web3Utils } from "../utils";
import { ethers, network } from "hardhat";
import config from "../config";

const { getContract } = new Web3Utils();

const main = async () => {
    // Get Token smart contract
    const Token = await getContract("Token");
    // Get Bridge smart contract
    const Bridge = await getContract("MemBridge");

    const bridgeAmount = ethers.parseEther("1");
    // Approve bridge smart contract get token from user
    const approveTx = await Token.approve(Bridge.target, bridgeAmount);

    // Wait transaction approve complete
    await approveTx.wait();
    console.log("Approve success, txHash::", approveTx.hash);

    // Get dest chain (if in source chain bridge to dest chain and vice versa)
    const toChainId =
        network.config.chainId == config.CHAIN_IDS[0]
            ? config.CHAIN_IDS[1]
            : config.CHAIN_IDS[0];

    // Bridge token
    const bridgeTx = await Bridge.bridge(bridgeAmount, toChainId);
    console.log("Success, txHash:: ", bridgeTx.hash);
};

main()
    .then(() => {
        console.info("Bridge step is complete");
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
