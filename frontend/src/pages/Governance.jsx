import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Plus, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { checkConnection } from '../utils/contract';
import {
  createProposal,
  voteProposal,
  executeProposal,
  getProposal,
  getProposalCount,
} from '../utils/defi-contract';

const PROPOSAL_STATUS = ['Active', 'Passed', 'Rejected', 'Executed'];

const DEMO_PROPOSALS = [
  {
    id: 1,
    title: 'Reduce platform fee to 2.0%',
    description: 'Proposal to reduce the base platform fee from 2.5% to 2.0% to attract more merchants.',
    proposer: '0x1234...5678',
    forVotes: 12500,
    againstVotes: 3200,
    startTime: Math.floor(Date.now() / 1000) - 86400,
    endTime: Math.floor(Date.now() / 1000) + 172800,
    executed: false,
    cancelled: false,
  },
  {
    id: 2,
    title: 'Add USDC payment support',
    description: 'Enable merchants to accept USDC alongside QIE for payment processing.',
    proposer: '0xabcd...ef01',
    forVotes: 8700,
    againstVotes: 5100,
    startTime: Math.floor(Date.now() / 1000) - 172800,
    endTime: Math.floor(Date.now() / 1000) + 86400,
    executed: false,
    cancelled: false,
  },
  {
    id: 3,
    title: 'Treasury allocation for marketing',
    description: 'Allocate 50,000 QIE from the treasury for Q1 2027 marketing initiatives.',
    proposer: '0x9876...5432',
    forVotes: 15000,
    againstVotes: 2100,
    startTime: Math.floor(Date.now() / 1000) - 604800,
    endTime: Math.floor(Date.now() / 1000) - 86400,
    executed: true,
    cancelled: false,
  },
];

function getProposalStatus(proposal) {
  if (proposal.cancelled) return 2;
  if (proposal.executed) return 3;
  const now = Math.floor(Date.now() / 1000);
  if (now < proposal.endTime) return 0; // Active
  return proposal.forVotes > proposal.againstVotes ? 1 : 2; // Passed or Rejected
}

function getStatusColor(status) {
  switch (status) {
    case 0: return 'text-[#3B82F6]'; // Active
    case 1: return 'text-[#10B981]'; // Passed
    case 2: return 'text-[#EF4444]'; // Rejected
    case 3: return 'text-[#A1A1AA]'; // Executed
    default: return 'text-[#71717A]';
  }
}

function getStatusBg(status) {
  switch (status) {
    case 0: return 'bg-[rgba(59,130,246,0.15)]';
    case 1: return 'bg-[rgba(16,185,129,0.15)]';
    case 2: return 'bg-[rgba(239,68,68,0.15)]';
    case 3: return 'bg-[rgba(161,161,170,0.1)]';
    default: return 'bg-[rgba(113,113,122,0.1)]';
  }
}

function ProposalCard({ proposal, onVote, voting, isDemo }) {
  const status = getProposalStatus(proposal);
  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const forPercent = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 50;
  const isActive = status === 0;
  const timeLeft = proposal.endTime > Math.floor(Date.now() / 1000)
    ? formatDistanceToNow(new Date(proposal.endTime * 1000), { addSuffix: false })
    : 'Ended';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="bg-[#111113] border border-[#27272A] rounded-lg p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#FAFAFA] truncate">{proposal.title}</h3>
          <p className="text-xs text-[#71717A] mt-0.5">
            by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
          </p>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusBg(status)} ${getStatusColor(status)} whitespace-nowrap`}>
          {PROPOSAL_STATUS[status]}
        </span>
      </div>

      <p className="text-xs text-[#A1A1AA] mb-4 line-clamp-2">{proposal.description}</p>

      {/* Vote bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#10B981] tabular-nums">{forPercent.toFixed(1)}% For</span>
          <span className="text-[#EF4444] tabular-nums">{(100 - forPercent).toFixed(1)}% Against</span>
        </div>
        <div className="w-full h-2 bg-[#1E1E21] rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#10B981] transition-all duration-300"
            style={{ width: `${forPercent}%` }}
          />
          <div
            className="h-full bg-[#EF4444] transition-all duration-300"
            style={{ width: `${100 - forPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-[#52525B] mt-1 tabular-nums">
          {totalVotes.toLocaleString()} total votes
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#71717A]">
          <Clock size={12} />
          {isActive ? timeLeft : timeLeft === 'Ended' ? 'Voting ended' : timeLeft}
        </div>

        {isActive && (
          <div className="flex gap-2">
            <button
              onClick={() => onVote(proposal.id, true)}
              disabled={voting}
              className="px-3 py-1.5 bg-[rgba(16,185,129,0.15)] hover:bg-[rgba(16,185,129,0.25)] text-[#10B981] text-xs font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
            >
              Vote For
            </button>
            <button
              onClick={() => onVote(proposal.id, false)}
              disabled={voting}
              className="px-3 py-1.5 bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#EF4444] text-xs font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
            >
              Vote Against
            </button>
          </div>
        )}

        {status === 1 && !proposal.executed && (
          <button
            onClick={() => onVote(proposal.id, null, 'execute')}
            disabled={voting}
            className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
          >
            Execute
          </button>
        )}
      </div>
    </motion.div>
  );
}

function CreateProposalModal({ isOpen, onClose, onSubmit, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    onSubmit(title.trim(), description.trim());
    setTitle('');
    setDescription('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="bg-[#111113] border border-[#27272A] rounded-lg w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold text-[#FAFAFA] tracking-tight mb-4">
            Create Proposal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-[#71717A] mb-1.5 block">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title"
                className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#71717A] mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the proposal and its impact..."
                rows={4}
                className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-3 py-2 text-sm text-[#FAFAFA] placeholder-[#52525B] outline-none focus:border-[#10B981] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-[#27272A] text-[#A1A1AA] text-sm font-medium rounded-md hover:border-[#3F3F46] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Governance() {
  const [proposals, setProposals] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const loadProposals = useCallback(async () => {
    try {
      const conn = await checkConnection();
      setIsDemo(conn.isDemo);

      if (conn.isDemo) {
        setProposals(DEMO_PROPOSALS);
        return;
      }

      const count = await getProposalCount().catch(() => 0);
      if (count === 0) {
        setProposals([]);
        return;
      }

      const loaded = [];
      for (let i = 1; i <= count; i++) {
        try {
          const p = await getProposal(i);
          loaded.push(p);
        } catch {
          // skip broken proposals
        }
      }
      setProposals(loaded);
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setProposals(DEMO_PROPOSALS);
      setIsDemo(true);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleVote = async (proposalId, support, action = 'vote') => {
    if (isDemo) {
      setProposals((prev) =>
        prev.map((p) => {
          if (p.id !== proposalId) return p;
          if (action === 'execute') return { ...p, executed: true };
          return {
            ...p,
            forVotes: support ? p.forVotes + 100 : p.forVotes,
            againstVotes: !support ? p.againstVotes + 100 : p.againstVotes,
          };
        })
      );
      toast.success(action === 'execute' ? 'Proposal executed (demo)' : `Vote cast (demo)`);
      return;
    }

    setVoting(true);
    try {
      if (action === 'execute') {
        await executeProposal(proposalId);
        toast.success('Proposal executed');
      } else {
        await voteProposal(proposalId, support);
        toast.success(`Voted ${support ? 'for' : 'against'} proposal`);
      }
      await loadProposals();
    } catch (err) {
      toast.error(err.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  const handleCreate = async (title, description) => {
    if (isDemo) {
      const newProposal = {
        id: proposals.length + 1,
        title,
        description,
        proposer: '0xDemo...1234',
        forVotes: 0,
        againstVotes: 0,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 259200,
        executed: false,
        cancelled: false,
      };
      setProposals((prev) => [newProposal, ...prev]);
      setShowCreate(false);
      toast.success('Proposal created (demo)');
      return;
    }

    setLoading(true);
    try {
      await createProposal(title, description);
      toast.success('Proposal created');
      setShowCreate(false);
      await loadProposals();
    } catch (err) {
      toast.error(err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const activeProposals = proposals.filter((p) => getProposalStatus(p) === 0);
  const pastProposals = proposals.filter((p) => getProposalStatus(p) !== 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-[#FAFAFA]">Governance</h1>
          <p className="text-xs text-[#A1A1AA] mt-0.5">Vote on protocol changes</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-sm font-medium rounded-md transition-colors duration-150"
        >
          <Plus size={14} />
          Create Proposal
        </button>
      </div>

      {/* Active Proposals */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-3">
          Active Proposals ({activeProposals.length})
        </h2>
        {activeProposals.length === 0 ? (
          <div className="bg-[#111113] border border-[#27272A] rounded-lg p-8 text-center">
            <Vote size={24} className="text-[#52525B] mx-auto mb-2" />
            <p className="text-sm text-[#71717A]">No active proposals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeProposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onVote={handleVote}
                voting={voting}
                isDemo={isDemo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Proposals */}
      {pastProposals.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-3 hover:text-[#71717A] transition-colors"
          >
            Past Proposals ({pastProposals.length})
            {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence>
            {showPast && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-3 overflow-hidden"
              >
                {pastProposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    onVote={handleVote}
                    voting={voting}
                    isDemo={isDemo}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {isDemo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#111113] border border-[#27272A]">
          <Info size={14} className="text-[#71717A] shrink-0" />
          <p className="text-xs text-[#71717A]">
            Demo mode — connect a wallet to interact with governance
          </p>
        </div>
      )}

      <CreateProposalModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        loading={loading}
      />
    </div>
  );
}
