pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MetaWallet {
    mapping(address => mapping(address => uint256)) private _balances;
    mapping(bytes32 => uint256) private _nonce;

    bytes constant PREFIX = "\x19Ethereum Signed Message:\n32";

    function _checkExpiry(uint256 expiry) internal view returns (bool) {
        if (expiry > 0) {
            require(now < expiry, "Transaction must be executed before expiry");
        }
        return true;
    }

    function _validateSignatures(address identityManager, uint256 level, bytes signature, bytes32 signatureData) internal view returns (bool) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
          r := mload(add(signature, 32))
          s := mload(add(signature, 64))
          v := and(mload(add(signature, 65)), 255)
        }
        if (v < 27) v += 27;
        address recovered = ecrecover(keccak256(PREFIX, signatureData), v, r, s);
        ERCXXXX_IdentityManager _identityManager = ERCXXXX_IdentityManager(identityManager);
        return _identityManager.hasRole(recovered, level);
    }

    function balanceOf(address token, address tokenOwner) external view returns(uint256) {
        return _balances[token][tokenOwner];
    }

    function deposit(address token, address to, uint256 value) external {
        ERC20 erc20 = ERC20(token);
        _balances[token][to] = value;
        require(erc20.transferFrom(msg.sender, address(this), value));
    }

    function withdraw(address token, address to, uint256 value) external {
        require(_balances[token][msg.sender] >= value);
        ERC20 erc20 = ERC20(token);
        _balances[token][msg.sender] = _balances[token][msg.sender] - value;
        require(erc20.transfer(to, value));
    }

    function execute(address to, uint256 value, bytes data, uint256 expiry, bytes signatures, address identityManager, address token, uint256 tokenTransfer) external {
        ERC20 erc20 = ERC20(token);
        bytes32 nonceKey = keccak256("execute", to, value, data, identityManager);
        bytes32 signatureData = keccak256(address(this), "execute", to, value, data, expiry, identityManager, token, tokenTransfer, _nonce[nonceKey]);
        _checkExpiry(expiry);
        require(_validateSignatures(identityManager, 2, signatures, signatureData), "Must have valid action signatures");
        ERCXXXX_IdentityManager _identityManager = ERCXXXX_IdentityManager(identityManager);
        _nonce[nonceKey]++;
        _identityManager.execute(to, value, data, 0);
        require(_balances[token][identityManager] >= tokenTransfer);
        _balances[token][identityManager] = _balances[token][identityManager] - tokenTransfer;
        _balances[token][msg.sender] = _balances[token][msg.sender] + tokenTransfer;
        require(erc20.transfer(msg.sender, tokenTransfer));
    }

    function getNonce(bytes32 nonceKey) external view returns (uint256) {
        return _nonce[nonceKey];
    }
}
