// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title QIEGovernance
 * @notice On-chain governance for QIEPay ecosystem
 * @dev SECURITY: Proposers must have stake. Voting weight = staked amount.
 *      Owner can cancel malicious proposals.
 */
contract QIEGovernance {
    address public owner;
    address public stakingContract;

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        bool cancelled;
    }

    uint256 public proposalCounter;
    uint256 public votingDuration = 3 days;
    uint256 public quorum = 100 ether; // minimum total votes needed
    uint256 public minimumStake = 1 ether; // minimum stake to propose/vote

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteDirection; // true = for

    event ProposalCreated(uint256 indexed id, address proposer, string title);
    event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Governance: not owner");
        _;
    }

    constructor(address _stakingContract) {
        owner = msg.sender;
        stakingContract = _stakingContract;
    }

    /**
     * @notice Create a governance proposal
     * @dev SECURITY: Requires minimum stake to prevent spam
     */
    function createProposal(string calldata _title, string calldata _description) external returns (uint256) {
        require(bytes(_title).length > 0, "Governance: empty title");
        require(bytes(_title).length <= 256, "Governance: title too long");

        // Check proposer has minimum stake
        if (stakingContract != address(0)) {
            (bool success, bytes memory data) = stakingContract.staticcall(
                abi.encodeWithSignature("getStake(address)", msg.sender)
            );
            if (success && data.length >= 32) {
                uint256 staked = abi.decode(data, (uint256));
                require(staked >= minimumStake, "Governance: insufficient stake to propose");
            }
        }

        proposalCounter++;
        uint256 id = proposalCounter;

        proposals[id] = Proposal({
            id: id,
            proposer: msg.sender,
            title: _title,
            description: _description,
            votesFor: 0,
            votesAgainst: 0,
            startTime: block.timestamp,
            endTime: block.timestamp + votingDuration,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(id, msg.sender, _title);
        return id;
    }

    /**
     * @notice Cast a vote on a proposal
     * @dev SECURITY: Voting weight = staked amount (not 1-per-address)
     */
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Governance: proposal not found");
        require(block.timestamp <= p.endTime, "Governance: voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Governance: already voted");
        require(!p.cancelled, "Governance: cancelled");

        // Voting weight = staked amount
        uint256 weight = 1 ether; // default if no staking contract
        if (stakingContract != address(0)) {
            (bool success, bytes memory data) = stakingContract.staticcall(
                abi.encodeWithSignature("getStake(address)", msg.sender)
            );
            if (success && data.length >= 32) {
                weight = abi.decode(data, (uint256));
            }
        }
        require(weight >= minimumStake, "Governance: insufficient stake to vote");

        hasVoted[_proposalId][msg.sender] = true;
        voteDirection[_proposalId][msg.sender] = _support;

        if (_support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }

    /**
     * @notice Execute a passed proposal
     * @dev In production, this would call other contracts via delegatecall
     */
    function executeProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Governance: proposal not found");
        require(block.timestamp > p.endTime, "Governance: voting still active");
        require(!p.executed, "Governance: already executed");
        require(!p.cancelled, "Governance: cancelled");
        require(p.votesFor > p.votesAgainst, "Governance: rejected");
        require(p.votesFor + p.votesAgainst >= quorum, "Governance: quorum not met");

        p.executed = true;
        emit ProposalExecuted(_proposalId);
    }

    /**
     * @notice Cancel a proposal (owner or proposer only)
     */
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(p.id != 0, "Governance: proposal not found");
        require(
            msg.sender == p.proposer || msg.sender == owner,
            "Governance: not authorized"
        );
        require(!p.executed, "Governance: already executed");

        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }

    function getProposal(uint256 _id) external view returns (Proposal memory) {
        require(proposals[_id].id != 0, "Governance: proposal not found");
        return proposals[_id];
    }

    function getProposalStatus(uint256 _id) external view returns (
        bool active,
        bool passed,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 totalVotes
    ) {
        Proposal storage p = proposals[_id];
        forVotes = p.votesFor;
        againstVotes = p.votesAgainst;
        totalVotes = forVotes + againstVotes;
        active = block.timestamp <= p.endTime && !p.cancelled;
        passed = forVotes > againstVotes && totalVotes >= quorum;
    }

    function setVotingDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 hours, "Governance: min 1 hour");
        require(_duration <= 30 days, "Governance: max 30 days");
        votingDuration = _duration;
    }

    function setQuorum(uint256 _quorum) external onlyOwner {
        quorum = _quorum;
    }

    function setMinimumStake(uint256 _minimum) external onlyOwner {
        minimumStake = _minimum;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Governance: zero address");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
