pragma solidity ^0.4.24;

import "./ERCXXXX_Identity.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MetaWallet is ERCXXXX_MetaWallet {
    mapping(address => mapping(address => uint256)) private _balances;

    function balanceOf(address token, address tokenOwner) external view returns(uint256) {
        return _balances[token][tokenOwner];
    }

    function deposit(address token, address to, uint256 value) external {
        ERC20 erc20 = ERC20(token);
        _balances[token][to] = value;
        require(erc20.transferFrom(msg.sender, address(this), value));
        emit Deposited(msg.sender, token, to, value);
    }

    function withdraw(address token, address to, uint256 value) external {
        require(_balances[token][msg.sender] >= value);
        ERC20 erc20 = ERC20(token);
        _balances[token][msg.sender] = _balances[token][msg.sender] - value;
        require(erc20.transfer(to, value));
        emit Withdrew(msg.sender, token, to, value);
    }

    function execute(address to, uint256 value, bytes data, uint256 expiry, address gasToken, uint256 gasPrice, uint256 gasLimit) external {}
}
