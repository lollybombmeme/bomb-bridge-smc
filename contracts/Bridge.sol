// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./IToken.sol";
import "hardhat/console.sol";

contract MemBridge is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Token contract
    IToken public token;
    // Pool Contract
    address public pool;
    // ChainID of chain Ethereum
    uint256 public chainIdEther = 1;
    // Bridge & Claim is disable on chain Ethereum
    bool public pauseETH;
    // Bridge & Claim is disable on chain token Wrap
    bool public pauseWrap;
    // Check ChainID support
    mapping(uint256 => bool) public chainIDSupport;
    // Mapping variable to check the existing of one transaction hash (make sure one sig can only be used just one time)
    mapping(uint256 => mapping(string => uint8)) public isUsedTxHash;

    // Signers for claim with signature
    EnumerableSet.AddressSet private signers;
    // Threshold verify signature;
    uint256 public signatureThreshold;

    // Proof Signature
    struct Proof {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Events
    event Bridge(uint256 amount, uint256 toChainID, address wallet);
    event Claim(uint256 amount, address walletReceive, string callbackData);

    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");

    constructor(
        address _tokenAddress,
        address[] memory _signers,
        address _pool,
        uint256 _threshold
    ) {
        require(_signers.length > 0, "At least one signer is required");
        require(
            _threshold > 0 && _threshold <= _signers.length,
            "Invalid threshold"
        );
        for (uint256 i = 0; i < _signers.length; i++) {
            address _signer = _signers[i];
            require(_signer != address(0), "Invalid signer address");
            signers.add(_signer);
        }
        signatureThreshold = _threshold;
        token = IToken(_tokenAddress);
        // signer = _signer;
        pool = _pool;
        chainIDSupport[42161] = true;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSE_ROLE, msg.sender);
    }

    /**
     *      Modifier check msg.sender must is wallet address
     */
    modifier notContract() {
        require(!_isContract(msg.sender), "Contract not allowed");
        require(msg.sender == tx.origin, "Proxy contract not allowed");
        _;
    }

    /**
     *      Bridge Token
     */
    function bridge(uint256 _amount, uint256 _toChainID) external notContract {
        require(chainIDSupport[_toChainID], "ChainID current is not supported");
        require(
            token.balanceOf(msg.sender) >= _amount,
            "User need hold enough Token"
        );
        if (getChainID() == chainIdEther) {
            require(!pauseETH, "Transfer to bridge is disabled");
            token.transferFrom(msg.sender, pool, _amount);
        } else {
            require(!pauseWrap, "Transfer to bridge is disabled");
            token.burn(msg.sender, _amount);
        }
        emit Bridge(_amount, _toChainID, msg.sender);
    }

    /**
     *      Claim token then bridge
     */
    function claim(
        uint256 _fromChainID,
        string memory _txHash,
        uint256 _amount,
        Proof[] memory _proofs
    ) external notContract {
        address _to = msg.sender;
        require(
            verifySignature(_fromChainID, _txHash, _amount, _proofs),
            "Invalid Signature"
        );
        if (getChainID() == chainIdEther) {
            require(!pauseETH, "Claim is disable");
            token.transferFrom(pool, _to, _amount);
        } else {
            require(!pauseWrap, "Claim is disable");
            token.mint(_to, _amount);
        }
        emit Claim(_amount, _to, _txHash);
    }

    /**
     *      Verify Signature
     */
    function verifySignature(
        uint256 _fromChainID,
        string memory _txHash,
        uint256 _amount,
        Proof[] memory _proofs
    ) internal returns (bool) {
        uint256 _countSignature;
        address[] memory _signatories = new address[](_proofs.length);
        for (uint256 i = 0; i < _proofs.length; i++) {
            Proof memory _proof = _proofs[i];
            bytes32 _digest = keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    keccak256(
                        abi.encode(
                            getChainID(),
                            _fromChainID,
                            tx.origin,
                            address(this),
                            _txHash,
                            _amount
                        )
                    )
                )
            );
            address _signatory = ecrecover(
                _digest,
                _proof.v,
                _proof.r,
                _proof.s
            );
            require(
                !checkDuplicateSignatory(_signatories, _signatory),
                "Duplicated Signatory"
            );
            if (!signers.contains(_signatory)) {
                return false;
            }
            _signatories[i] = _signatory;
            _countSignature++;
        }
        require(
            isUsedTxHash[_fromChainID][_txHash] == 0,
            "The transaction hash has already been used"
        );
        isUsedTxHash[_fromChainID][_txHash] = 1;
        return signatureThreshold <= _countSignature;
    }

    /**
     *      Function allows checking duplicate signatories
     */
    function checkDuplicateSignatory(
        address[] memory _signatories,
        address _signatory
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < _signatories.length; i++) {
            if (_signatory == _signatories[i]) {
                return true;
            }
        }
        return false;
    }

    /**
     *      Get ChainID current
     */
    function getChainID() private view returns (uint256) {
        return block.chainid;
    }

    /**
     *      Allow owner set new chainID Ether
     */

    function setPauseETH(bool _flag) external onlyRole(PAUSE_ROLE) {
        pauseETH = _flag;
    }

    function setPauseWrap(bool _flag) external onlyRole(PAUSE_ROLE) {
        pauseWrap = _flag;
    }

    function setChainIdEther(
        uint256 _chainIdEther
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        chainIdEther = _chainIdEther;
    }

    /**
     *      Allow owner update ChainID's Support
     */
    function setChainIdSupport(
        uint256 _chainId,
        bool _flag
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        chainIDSupport[_chainId] = _flag;
    }

    /**
     *      Allow owner set new signers
     */
    function setSigners(
        address[] memory _signers
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < signers.length(); i++) {
            signers.remove(signers.at(i));
        }
        for (uint256 i = 0; i < _signers.length; i++) {
            signers.add(_signers[i]);
        }
    }

    /**
     *      Allow owner set new signatureThreshold
     */
    function setThreshold(
        uint256 _signatureThreshold
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        signatureThreshold = _signatureThreshold;
    }

    /**
     *      Allow owner set new token
     */
    function setToken(
        address _tokenAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        token = IToken(_tokenAddress);
    }

    /**
     * @notice Checks if address is a contract
     */
    function _isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
}
