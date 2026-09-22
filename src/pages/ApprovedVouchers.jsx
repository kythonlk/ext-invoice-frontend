import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  Building2, 
  Layers, 
  UserCheck, 
  X, 
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  Package,
  History,
  Paperclip,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getFileUrl } from '../lib/api';

function ApprovedVouchers({ user }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [detailVoucher, setDetailVoucher] = useState(null);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [detailTab, setDetailTab] = useState('history');
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Sorting and Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'UpdatedAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchApprovedVouchers();
    const onCompanyChanged = () => {
      fetchApprovedVouchers();
    };
    window.addEventListener('focusx:company-changed', onCompanyChanged);
    return () => window.removeEventListener('focusx:company-changed', onCompanyChanged);
  }, []);

  const fetchApprovedVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/vouchers/approved');
      setVouchers(res.data || []);
    } catch (err) {
      console.error('Failed to load approved vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVoucherDetails = async (voucher) => {
    setDetailVoucher(voucher);
    setLoadingDetails(true);
    setDetailTab('history');
    try {
      const res = await api.get(`/vouchers/${voucher.ID}/details`);
      setVoucherDetails(res.data);
    } catch (err) {
      console.error('Failed to load voucher details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const voucherTypes = useMemo(() => {
    const types = new Set();
    vouchers.forEach(v => {
      const label = v.VoucherTypeLabel || v.VoucherTypeCode || (v.VoucherType ? `Type ${v.VoucherType}` : 'Voucher');
      types.add(label);
    });
    return ['ALL', ...Array.from(types)];
  }, [vouchers]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (v.VoucherNo && v.VoucherNo.toLowerCase().includes(q)) ||
        (v.VoucherTypeLabel && v.VoucherTypeLabel.toLowerCase().includes(q)) ||
        (v.approvers && v.approvers.some(a => a.approver && a.approver.toLowerCase().includes(q)));
      
      const typeLabel = v.VoucherTypeLabel || v.VoucherTypeCode || (v.VoucherType ? `Type ${v.VoucherType}` : 'Voucher');
      const matchesType = selectedType === 'ALL' || typeLabel === selectedType;

      return matchesSearch && matchesType;
    });
  }, [vouchers, searchQuery, selectedType]);

  // Sort vouchers
  const sortedVouchers = [...filteredVouchers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    if (sortConfig.key === 'UpdatedAt') {
      valA = a.UpdatedAt || a.CreatedAt ? new Date(a.UpdatedAt || a.CreatedAt).getTime() : 0;
      valB = b.UpdatedAt || b.CreatedAt ? new Date(b.UpdatedAt || b.CreatedAt).getTime() : 0;
    }
    
    if (valA < valB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginate vouchers
  const totalPages = Math.ceil(sortedVouchers.length / itemsPerPage);
  const paginatedVouchers = sortedVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />;
  };

  // Reset page when search or type changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType]);

  const stats = useMemo(() => {
    const totalCount = vouchers.length;
    const totalAmount = vouchers.reduce((acc, v) => acc + (v.NetAmount || 0), 0);
    const totalSigns = vouchers.reduce((acc, v) => acc + (v.approvers ? v.approvers.length : 0), 0);
    return { totalCount, totalAmount, totalSigns };
  }, [vouchers]);

  const resolveDocumentUrl = (path) => {
    return getFileUrl(path);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/20">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Approved Vouchers & History
              </h1>
              <p className="text-xs text-slate-500">
                Audit and verify completed approval workflows, signatures, and stamped ERP documents
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchApprovedVouchers}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          Refresh History
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="erp-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fully Approved</p>
            <h3 className="text-xl font-black text-slate-900">{stats.totalCount} Vouchers</h3>
          </div>
        </div>

        <div className="erp-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Approved Value</p>
            <h3 className="text-xl font-black text-slate-900">AED {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="erp-card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Digital Signatures Applied</p>
            <h3 className="text-xl font-black text-slate-900">{stats.totalSigns} E-Signs</h3>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="erp-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher # or approver..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase whitespace-nowrap">Filter:</span>
          {voucherTypes.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                selectedType === t 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers List */}
      {loading ? (
        <div className="erp-card p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-slate-600">Loading approved vouchers history...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="erp-card p-12 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">No approved vouchers found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter.</p>
        </div>
      ) : (
        <div className="erp-card overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-2 py-4 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('VoucherNo')}>
                    <div className="flex items-center gap-1.5">VOUCHER # <SortIcon columnKey="VoucherNo" /></div>
                  </th>
                  <th className="px-2 py-4 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('VoucherType')}>
                    <div className="flex items-center gap-1.5">TYPE <SortIcon columnKey="VoucherType" /></div>
                  </th>
                  <th className="px-2 py-4 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('CostCenterID')}>
                    <div className="flex items-center gap-1.5">COST CENTER <SortIcon columnKey="CostCenterID" /></div>
                  </th>
                  <th className="px-2 py-4 cursor-pointer group hover:bg-slate-100/50 transition-colors" onClick={() => handleSort('UpdatedAt')}>
                    <div className="flex items-center gap-1.5">UPDATED <SortIcon columnKey="UpdatedAt" /></div>
                  </th>
                  <th className="px-2 py-4 cursor-pointer group hover:bg-slate-100/50 transition-colors text-right" onClick={() => handleSort('NetAmount')}>
                    <div className="flex items-center justify-end gap-1.5"><SortIcon columnKey="NetAmount" /> NET AMOUNT</div>
                  </th>
                  <th className="px-2 py-4">SIGNATURES</th>
                  <th className="px-2 py-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedVouchers.map((v, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    key={v.ID} 
                    className="hover:bg-indigo-50/40 transition-colors group/row"
                  >
                    <td className="px-2 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5 border border-emerald-100/50 group-hover/row:bg-emerald-100/80 transition-colors">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 group-hover/row:text-indigo-700 transition-colors text-[15px]">#{v.VoucherNo}</span>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700">{v.CreatedByName || `User ${v.CreatedBy}`}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 align-top">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 inline-block mb-1">
                        {v.VoucherTypeCode || `Type ${v.VoucherType}`}
                      </span>
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">{v.VoucherTypeLabel}</div>
                    </td>
                    <td className="px-2 py-4 align-top">
                      {v.CostCenterID > 0 ? (
                        <div>
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 inline-block mb-1">
                            #{v.CostCenterID}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-2 py-4 align-top">
                      <span className="font-semibold text-slate-700 text-[13px]">{new Date(v.UpdatedAt || v.CreatedAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-2 py-4 align-top text-right">
                      <span className="font-bold text-indigo-700 text-[15px]">AED {(v.NetAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-2 py-4 align-top">
                      {v.approvers && v.approvers.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap w-full max-w-[200px]">
                          {v.approvers.map((appr, idx) => (
                            <div 
                              key={idx}
                              title={`Level ${appr.level}: ${appr.approver}`}
                              className="w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-2xs"
                            >
                              {appr.e_sign_used ? (
                                <img 
                                  src={resolveDocumentUrl(appr.e_sign_used)} 
                                  alt="Sign" 
                                  className="max-h-5 max-w-full object-contain mix-blend-multiply" 
                                />
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 w-full h-full flex items-center justify-center">L{appr.level}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-2 py-4 align-top">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {v.DocumentURL && (
                          <button
                            onClick={() => setPreviewDoc(v)}
                            className="px-2.5 py-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> Stamped PDF
                          </button>
                        )}
                        <button
                          onClick={() => loadVoucherDetails(v)}
                          className="px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" /> Audit Details
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-slate-500 font-medium">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedVouchers.length)} to {Math.min(currentPage * itemsPerPage, sortedVouchers.length)} of {sortedVouchers.length} vouchers in history
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-bold transition-colors shadow-2xs ${
                      currentPage === page 
                        ? 'bg-indigo-600 text-white border border-indigo-600' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stamped Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-emerald-600" />
                    Stamped Official Document
                  </h3>
                  <p className="text-xs text-slate-500">
                    Voucher #{previewDoc.VoucherNo} (Fully Authorized with Bottom Digital Stamps)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={resolveDocumentUrl(previewDoc.DocumentURL)}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="py-4">
                <iframe 
                  src={resolveDocumentUrl(previewDoc.DocumentURL)} 
                  className="w-full h-[65dvh] bg-white rounded-xl border border-slate-200 shadow-inner" 
                  title={`Stamped Document for ${previewDoc.VoucherNo}`} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Audit Detail Drawer */}
      <AnimatePresence>
        {detailVoucher && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Approved
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Voucher #{detailVoucher.VoucherNo}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {detailVoucher.VoucherTypeLabel || detailVoucher.VoucherTypeCode} · AED {detailVoucher.NetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button 
                  onClick={() => { setDetailVoucher(null); setVoucherDetails(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex border-b border-slate-100 px-5 gap-4">
                <button
                  onClick={() => setDetailTab('history')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                    detailTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <History className="w-3.5 h-3.5" /> Signatures & Logs
                </button>
                <button
                  onClick={() => setDetailTab('items')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                    detailTab === 'items' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> ERP Items
                </button>
                <button
                  onClick={() => setDetailTab('document')}
                  className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                    detailTab === 'document' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" /> Document
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                {loadingDetails ? (
                  <div className="py-12 text-center text-xs text-slate-400">Loading audit details...</div>
                ) : detailTab === 'history' ? (
                  voucherDetails?.approval_history?.length ? (
                    <div className="space-y-3">
                      {voucherDetails.approval_history.map((entry) => (
                        <div key={entry.id} className="erp-card p-4 flex gap-3 items-start justify-between">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {entry.action} by {entry.approver}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Level {entry.level} · {new Date(entry.created_at).toLocaleString()}
                              </p>
                              {entry.remarks && (
                                <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                  {entry.remarks}
                                </p>
                              )}
                            </div>
                          </div>

                          {entry.e_sign_used ? (
                            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg max-w-[120px] max-h-12 flex items-center justify-center shrink-0 shadow-2xs">
                              <img 
                                src={getFileUrl(entry.e_sign_used)} 
                                alt="Signature" 
                                className="max-h-9 max-w-full object-contain" 
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                              Verified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">No logs found.</div>
                  )
                ) : detailTab === 'items' ? (
                  voucherDetails?.items?.length ? (
                    <div className="space-y-2">
                      {voucherDetails.items.map((item, idx) => (
                        <div key={idx} className="erp-card p-3 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{item.product_name || item.product_code}</p>
                            <p className="text-slate-400">Qty: {item.quantity} {item.unit_name} @ AED {item.rate}</p>
                          </div>
                          <span className="font-bold text-slate-900">AED {item.gross?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">No inventory lines.</div>
                  )
                ) : (
                  detailVoucher.DocumentURL ? (
                    <iframe 
                      src={resolveDocumentUrl(detailVoucher.DocumentURL)} 
                      className="w-full h-[60dvh] rounded-xl border border-slate-200" 
                      title="Doc" 
                    />
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">No document attached.</div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ApprovedVouchers;
