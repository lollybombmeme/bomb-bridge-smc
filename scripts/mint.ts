import { Web3Utils } from "../utils";
import hardhat from "hardhat";

const { getContract } = new Web3Utils();

const main = async () => {
    const [deployer] = await hardhat.ethers.getSigners()
    // Get Token smart contract
    const Token = await getContract("Token");

    const mintAmount = hardhat.ethers.parseEther("1000");
    const mintTo = deployer.address; // Default value is deployer address

    // Mint token for address
    const mintTx = await Token.mint(mintTo, mintAmount);

    console.log(
        `Mint: ${mintAmount} ${await Token.symbol()}\nTxHash:: ${mintTx.hash}`
    );
};

main()
    .then(() => {
        console.info("Mint step is complete");
    })
    .catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
