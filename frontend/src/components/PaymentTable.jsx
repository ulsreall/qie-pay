import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, SortDesc, ExternalLink, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatUSD, formatQIEAmount } from '../utils/currency';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

export default function PaymentTable({ payments = [], showActions = false, onSettle, onCancel }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = [...payments];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.description?.toLowerCase().includes(q) ||
          p.orderId?.toLowerCase().includes(q) ||
          p.id?.toString().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === Number(statusFilter));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDir === 'desc' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
      }
      const aAmt = parseFloat(a.amount) || 0;
      const bAmt = parseFloat(b.amount) || 0;
      return sortDir === 'desc' ? bAmt - aAmt : aAmt - bAmt;
    });

    return result;
  }, [payments, search, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    try {
      return format(new Date(ts * 1000), 'MMM d, yyyy HH:mm');
    } catch {
      return '—';
    }
  };

  const truncateAddr = (addr) => {
    if (!addr) return '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by description, order ID, or payment ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">All Statuses</option>
              <option value="0" className="bg-slate-800">Created</option>
              <option value="1" className="bg-slate-800">Paid</option>
              <option value="2" className="bg-slate-800">Settled</option>
              <option value="3" className="bg-slate-800">Refunded</option>
              <option value="4" className="bg-slate-800">Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => toggleSort(sortBy === 'date' ? 'amount' : 'date')}
            className="btn-secondary text-sm"
          >
            {sortDir === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
            {sortBy === 'date' ? 'Date' : 'Amount'}
          </button>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 text-lg font-medium">No payments found</p>
          <p className="text-slate-500 text-sm mt-1">
            {search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Payments will appear here'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                {showActions && <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <AnimatePresence mode="popLayout">
                {paginated.map((payment, i) => (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm text-emerald-400 font-mono">#{payment.id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-200 truncate max-w-[200px] block">{payment.description || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-400">{payment.orderId || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm text-slate-50 font-medium">{formatQIEAmount(payment.amount)} QIE</span>
                        <span className="block text-xs text-slate-500">{formatUSD(payment.amount)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={payment.status} />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-400">{formatDate(payment.createdAt)}</span>
                    </td>
                    {showActions && (
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/pay/${payment.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                            title="View"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          {payment.status === 1 && onSettle && (
                            <button
                              onClick={() => onSettle(payment.id)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                              title="Settle"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {payment.status === 0 && onCancel && (
                            <button
                              onClick={() => onCancel(payment.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/pay/${payment.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 transition-colors"
                            title="Invoice"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
