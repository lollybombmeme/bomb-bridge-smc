import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import config from "./config";

const hardhatConfig: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        ethereum: {
            accounts: [config.DEPLOYER_PRIVATE_KEY],
            chainId: 1,
            url: "https://eth.llamarpc.com",
        },
        bnb: {
            accounts: [config.DEPLOYER_PRIVATE_KEY],
            chainId: 56,
            url: "https://binance.llamarpc.com",
        },
        sepolia: {
            accounts: [config.DEPLOYER_PRIVATE_KEY],
            chainId: 11155111,
            url: "https://sepolia.drpc.org",
        },
    },
    etherscan: {
        apiKey: {
            ethereum: `${process.env.ETHEREUM_API_KEY}`,
            bnb: `${process.env.BNB_API_KEY}`,
            sepolia: `${process.env.SEPOLIA_API_KEY}`,
        },
        customChains: [
            {
                network: "goerli",
                chainId: 5,
                urls: {
                    apiURL: "https://api-goerli.etherscan.io/api",
                    browserURL: "https://goerli.etherscan.io",
                },
            },
        ],
    },
};

export default hardhatConfig;
