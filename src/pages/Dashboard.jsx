import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, FileText, ChevronRight, Search, 
  ExternalLink, FileCheck, Layers, DollarSign, Clock, ShieldCheck, Eye, X, AlertCircle
} from 'lucide-react';

function Dashboard({ user }) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modal states
  const [previewDoc, setPreviewDoc] = useState(null); // Voucher object for document viewer
  const [actionVoucher, setActionVoucher] = useState(null); // Voucher object for action modal
  const [actionType, setActionType] = useState('Approve'); // Approve or Reject
  const [remarks, setRemarks] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vouchers/pending');
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handlePerformAction = async () => {
    if (!actionVoucher) return;
    setActionSubmitting(true);
    try {
      await api.post('/vouchers/approve', {
        voucher_id: actionVoucher.ID,
        action: actionType,
        remarks: remarks || `Actioned by ${user.Username || user.LoginName}`
      });
      setActionVoucher(null);
      setRemarks('');
      fetchVouchers();
    } catch (err) {
      alert('Failed to perform authorization action');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch = v.VoucherNo?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String(v.FocusHeaderID).includes(searchQuery);
    const matchesType = selectedType === 'all' || String(v.VoucherType) === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate statistics
  const totalAmount = vouchers.reduce((acc, curr) => acc + (curr.NetAmount || 0), 0);
  const voucherTypesCount = new Set(vouchers.map(v => v.VoucherType)).size;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Welcome Banner & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="erp-card p-5 border-l-4 border-l-indigo-600 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Authorizations</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{vouchers.length}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Queue
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="erp-card p-5 border-l-4 border-l-blue-600 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pending Value</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">AED {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across all cost centers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="erp-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Modules</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{voucherTypesCount}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">MRE, DEV, CEB, PUV</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="erp-card p-5 border-l-4 border-l-emerald-600 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">My E-Signature</p>
            <h3 className="text-sm font-bold text-slate-800 mt-1 truncate">{user.Username || user.LoginName}</h3>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Verified Approver
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="erp-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedType === 'all' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Modules ({vouchers.length})
          </button>
          {Array.from(new Set(vouchers.map(v => v.VoucherType))).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(String(type))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === String(type)
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Module {type} ({vouchers.filter(v => v.VoucherType === type).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Voucher # or Header ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Main Voucher Table / Cards */}
      {loading ? (
        <div className="erp-card p-16 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500">Querying PostgreSQL & Focus ERP Database...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="erp-card p-16 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">All Approvals Up to Date!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no pending vouchers requiring your level authorization.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVouchers.map((v, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              key={v.ID} 
              className="erp-card erp-card-hover p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">{v.VoucherNo}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Module {v.VoucherType}
                    </span>
                    {v.CostCenterID > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        Cost Center #{v.CostCenterID}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
                    <div>Focus Header ID: <strong className="text-slate-800">{v.FocusHeaderID}</strong></div>
                    <div>ERP Date: <strong className="text-slate-800">{v.Date ? new Date(v.Date * 1000).toLocaleDateString() : 'N/A'}</strong></div>
                    <div>NetAmount: <strong className="text-indigo-700 text-sm font-bold">AED {v.NetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                <div className="text-right mr-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Level {v.CurrentLevel} Pending
                  </span>
                  {v.DocumentURL && (
                    <button 
                      onClick={() => setPreviewDoc(v)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold block mt-1 flex items-center justify-end gap-1 ml-auto"
                    >
                      <Eye className="w-3 h-3" /> View ERP Document
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setActionVoucher(v);
                      setActionType('Reject');
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-all text-xs border border-rose-200 flex items-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>

                  <button 
                    onClick={() => {
                      setActionVoucher(v);
                      setActionType('Approve');
                    }}
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Authorize
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">ERP Attached Document</h3>
                  <p className="text-xs text-slate-500">Voucher #{previewDoc.VoucherNo} (Header ID: {previewDoc.FocusHeaderID})</p>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
                  {previewDoc.DocumentURL ? (
                    previewDoc.DocumentURL.endsWith('.pdf') ? (
                      <iframe src={previewDoc.DocumentURL} className="w-full h-96 rounded-lg border" title="ERP Doc"></iframe>
                    ) : (
                      <img src={previewDoc.DocumentURL} alt="Document" className="max-h-80 mx-auto rounded-lg shadow-xs" />
                    )
                  ) : (
                    <div>
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">Document File Attached from Focus ERP</p>
                      <p className="text-xs text-slate-400 mt-1">URL: {previewDoc.DocumentURL || '/uploads/erp_doc_sample.pdf'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action / Authorization Modal */}
      <AnimatePresence>
        {actionVoucher && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {actionType === 'Approve' ? (
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-rose-100 text-rose-700 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      {actionType === 'Approve' ? 'Authorize & E-Sign' : 'Reject Voucher'}
                    </h3>
                    <p className="text-xs text-slate-500">Voucher #{actionVoucher.VoucherNo}</p>
                  </div>
                </div>
                <button onClick={() => setActionVoucher(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4">
                {actionType === 'Approve' && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                    <p className="text-xs font-bold text-emerald-900">E-Signature Digital Stamp Applied:</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Approver: {user.Username || user.LoginName} • Timestamp: {new Date().toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Approval Remarks / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={actionType === 'Approve' ? 'Enter authorization notes...' : 'Reason for rejection...'}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setActionVoucher(null)} 
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePerformAction}
                  disabled={actionSubmitting}
                  className={`px-5 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md ${
                    actionType === 'Approve' 
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20' 
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  {actionSubmitting ? 'Processing...' : (actionType === 'Approve' ? 'Confirm Approval' : 'Confirm Rejection')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
