pragma solidity ^0.4.24;

import "./VaultManager.sol";
import "@aragon/apps-vault/contracts/Vault.sol";

contract AragonVaultManager is IVaultManager {

    address public owner;
    Vault public aragonVault;

    modifier onlyOwner {
        require(msg.sender == owner, "ERR:NOT_OWNER");
        _;
    }

    constructor(address _owner, Vault _aragonVault) public {
        owner = _owner;
        aragonVault = _aragonVault;
    }

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
    }

    function balance(address _token) public returns (uint256) {
        return aragonVault.balance(_token);
    }

    function transfer(address _token, address _beneficiary, uint256 _amount) public onlyOwner {
        aragonVault.transfer(_token, _beneficiary, _amount);
    }
}
