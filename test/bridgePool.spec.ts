import hardhat from 'hardhat'
import { BridgePool, Token } from '../typechain-types';
import * as chai from 'chai'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

const { ethers } = hardhat

describe('Token', async function () {
    let TokenSmc: Token
    let BridgePoolSmc: BridgePool

    let owner: HardhatEthersSigner
    let user: HardhatEthersSigner

    before(async function () {
        [owner, user] = await ethers.getSigners();

        const TokenContractFactory = await ethers.getContractFactory("Token")
        TokenSmc = await TokenContractFactory.deploy("MyToken", "MTK");
        const BridgePoolFactory = await ethers.getContractFactory("BridgePool")
        BridgePoolSmc = await BridgePoolFactory.deploy(TokenSmc.target, owner.address)
    });

    it("Check balance", async () => {
        const mintAmount = ethers.parseEther("10000")
        await TokenSmc.mint(BridgePoolSmc.target, mintAmount)

        chai.expect(await BridgePoolSmc.balance()).equal(mintAmount, "Invalid balance");
    })

    it("Transfer from pool: Unauthorized", async () => {
        const tokenAmount = ethers.parseEther("10")
        await chai.expect(TokenSmc.transferFrom(BridgePoolSmc.target, user.address, tokenAmount)).to.be.rejectedWith("ERC20InsufficientAllowance")
    })

    it("Transfer from pool", async () => {
        const tokenAmount = ethers.parseEther("10")
        const userPreBalance = await TokenSmc.balanceOf(user.address)
        const poolPreBalance = await BridgePoolSmc.balance()

        await BridgePoolSmc.authorizeBridge(owner.address)
        await TokenSmc.transferFrom(BridgePoolSmc.target, user.address, tokenAmount)

        chai.expect(await TokenSmc.balanceOf(user.address)).equal(userPreBalance + tokenAmount, "Token transfer failed")
        chai.expect(await BridgePoolSmc.balance()).equal(poolPreBalance - tokenAmount, "Token transfer failed")
    })

    it("Transfer from pool: Exceed amount", async () => {
        const tokenAmount = ethers.parseEther("1000000")
        await chai.expect(TokenSmc.transferFrom(BridgePoolSmc.target, user.address, tokenAmount)).to.be.rejectedWith("ERC20InsufficientBalance")
    })
});