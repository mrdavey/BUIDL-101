pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Mintable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

contract MyToken is Initializable, ERC20, ERC20Detailed, ERC20Mintable {

  function initialize() initializer public {
    ERC20Mintable.initialize(msg.sender);
    ERC20Detailed.initialize("MyName", "TKN", 18);
  }

}