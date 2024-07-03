import hardhat from "hardhat";
import { BridgePool, MemBridge, Token } from "../typechain-types";
import * as chai from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers, network } = hardhat;

describe("Token", async function () {
    let TokenSmc: Token;
    let BridgePoolSmc: BridgePool;
    let MemBridgeSmc: MemBridge;

    let owner: HardhatEthersSigner;
    let user: HardhatEthersSigner;
    let signers: HardhatEthersSigner[];

    before(async function () {
        [owner, user, ...signers] = await ethers.getSigners();
        signers = signers.slice(0, 3);

        const TokenContractFactory = await ethers.getContractFactory("Token");
        TokenSmc = await TokenContractFactory.deploy("MyToken", "MTK");
        const BridgePoolFactory = await ethers.getContractFactory("BridgePool");
        BridgePoolSmc = await BridgePoolFactory.deploy(
            TokenSmc.target,
            owner.address
        );
        const MemBridgeFactory = await ethers.getContractFactory("MemBridge");
        MemBridgeSmc = await MemBridgeFactory.deploy(
            TokenSmc.target,
            signers,
            BridgePoolSmc.target,
            2n
        );

        await TokenSmc.grantRole(
            await TokenSmc.MINTER_ROLE(),
            MemBridgeSmc.target
        );
        await TokenSmc.grantRole(
            await TokenSmc.BURNER_ROLE(),
            MemBridgeSmc.target
        );

        await TokenSmc.mint(owner.address, ethers.parseEther("100"));
        await TokenSmc.mint(user.address, ethers.parseEther("100"));

        await BridgePoolSmc.authorizeBridge(MemBridgeSmc.target);
        await MemBridgeSmc.setChainIdSupport(1n, true);
    });

    it("Bridge: ChainId not support", async () => {
        const approvalAmount = ethers.parseEther("1");
        const bridgeAmount = ethers.parseEther("1");

        const approveTx = await TokenSmc.approve(
            MemBridgeSmc.target,
            approvalAmount
        );
        await approveTx.wait();

        await chai
            .expect(MemBridgeSmc.bridge(bridgeAmount, 12n))
            .to.be.rejectedWith("ChainID current is not supported");
    });

    it("Bridge: Not enough balance", async () => {
        const bridgeAmount = ethers.parseEther("10000");
        const approveTx = await TokenSmc.approve(
            MemBridgeSmc.target,
            bridgeAmount
        );
        await approveTx.wait();

        await chai
            .expect(MemBridgeSmc.bridge(bridgeAmount, 1n))
            .to.be.rejectedWith("User need hold enough Token");
    });

    it("Bridge", async () => {
        const preBalance = await TokenSmc.balanceOf(owner.address);
        const bridgeAmount = ethers.parseEther("1");
        const approveTx = await TokenSmc.approve(
            MemBridgeSmc.target,
            bridgeAmount
        );
        await approveTx.wait();

        await MemBridgeSmc.bridge(bridgeAmount, 1n);
        chai.expect(await TokenSmc.balanceOf(owner.address)).equal(
            preBalance - bridgeAmount,
            "Token is not subtracted"
        );
    });

    it("Claim", async () => {
        const fromChainId = 1n;
        const txHash = "<rand_tx_hash>";
        const bridgeAmount = ethers.parseEther("1");

        const abiCode = new ethers.AbiCoder();
        const message = ethers.keccak256(
            abiCode.encode(
                [
                    "uint256",
                    "uint256",
                    "address",
                    "address",
                    "string",
                    "uint256",
                ],
                [
                    network.config.chainId,
                    fromChainId,
                    owner.address,
                    MemBridgeSmc.target,
                    txHash,
                    bridgeAmount,
                ]
            )
        );
        const signatures: MemBridge.ProofStruct[] = [];

        for (let signer of signers) {
            const signature = await signer.signMessage(
                ethers.getBytes(message)
            );
            const { r, s, v } = ethers.Signature.from(signature);
            signatures.push({ r, s, v } as MemBridge.ProofStruct);
        }

        await MemBridgeSmc.claim(fromChainId, txHash, bridgeAmount, signatures);
    });
});
