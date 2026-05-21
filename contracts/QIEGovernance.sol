// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
    uint256 public quorum = 100 ether; // minimum votes needed
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteDirection; // true = for
    
    event ProposalCreated(uint256 indexed id, address proposer, string title);
    event VoteCast(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCancelled(uint256 indexed id);
    
    modifier onlyOwner() { require(msg.sender == owner); _; }
    
    constructor(address _stakingContract) {
        owner = msg.sender;
        stakingContract = _stakingContract;
    }
    
    function createProposal(string calldata _title, string calldata _description) external returns (uint256) {
        // Must have stake to propose
        // (simplified — in production, call stakingContract.getStake)
        
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
    
    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp <= p.endTime, "Voting ended");
        require(!hasVoted[_proposalId][msg.sender], "Already voted");
        require(!p.cancelled, "Proposal cancelled");
        
        // Weight = staked amount (simplified: use msg.value or staking query)
        // For hackathon: each address gets 1 vote weight
        uint256 weight = 1 ether; // simplified
        
        hasVoted[_proposalId][msg.sender] = true;
        voteDirection[_proposalId][msg.sender] = _support;
        
        if (_support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }
        
        emit VoteCast(_proposalId, msg.sender, _support, weight);
    }
    
    function executeProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(block.timestamp > p.endTime, "Voting still active");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Cancelled");
        require(p.votesFor > p.votesAgainst, "Proposal rejected");
        require(p.votesFor + p.votesAgainst >= quorum, "Quorum not met");
        
        p.executed = true;
        emit ProposalExecuted(_proposalId);
    }
    
    function cancelProposal(uint256 _proposalId) external {
        Proposal storage p = proposals[_proposalId];
        require(msg.sender == p.proposer || msg.sender == owner, "Not authorized");
        p.cancelled = true;
        emit ProposalCancelled(_proposalId);
    }
    
    function getProposal(uint256 _id) external view returns (Proposal memory) {
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
        votingDuration = _duration;
    }
    
    function setQuorum(uint256 _quorum) external onlyOwner {
        quorum = _quorum;
    }
}
