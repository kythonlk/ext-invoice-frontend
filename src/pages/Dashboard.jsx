import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getVoucherType, getVoucherTypeLabel } from '../lib/voucherTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, XCircle, FileText, Search, 
  Layers, DollarSign, Clock, ShieldCheck, Eye, X, RefreshCw,
  Package, ReceiptText, History, Paperclip, Loader2, Info,
  UploadCloud, PlusCircle, ChevronRight, Pencil
} from 'lucide-react';

const resolveDocumentUrl = (url) => {
  if (!url || /^https?:\/\//i.test(url)) return url;
  return new URL(url, api.defaults.baseURL).toString();
};

function Dashboard({ user }) {
  const navigate = useNavigate();
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
  const [detailVoucher, setDetailVoucher] = useState(null);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [detailTab, setDetailTab] = useState('items');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Invoice Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [costCenters, setCostCenters] = useState([]);
  const [uploadModule, setUploadModule] = useState('1281');
  const [uploadVoucherNo, setUploadVoucherNo] = useState('');
  const [uploadAmount, setUploadAmount] = useState('');
  const [uploadCostCenter, setUploadCostCenter] = useState('');
  const [uploadRemarks, setUploadRemarks] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);

  const [workflows, setWorkflows] = useState([]);
  const [showWorkflowsSection, setShowWorkflowsSection] = useState(true);

  const isSuperUser = user && (
    user.role === 'superuser' || 
    user.Role === 'superuser' || 
    user.role === 'admin' || 
    user.Role === 'admin' || 
    user.login_name === 'su' || 
    user.LoginName === 'su' || 
    user.FocusUserID === 1
  );

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

  const fetchCostCenters = async () => {
    try {
      const res = await api.get('/cost-centers');
      setCostCenters(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load cost centers:', err);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const res = await api.get('/workflows');
      setWorkflows(Array.isArray(res.data) ? res.data : []);
    } catch {
      try {
        const fallback = await api.get('/admin/workflows');
        setWorkflows(Array.isArray(fallback.data) ? fallback.data : []);
      } catch (err) {
        console.error('Failed to load workflows:', err);
      }
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchCostCenters();
    fetchWorkflows();
  }, []);

  const handleUploadInvoice = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMessage({ type: 'error', text: 'Please select an invoice document to upload.' });
      return;
    }
    setUploadSubmitting(true);
    setUploadMessage(null);
    try {
      const formData = new FormData();
      formData.append('voucher_type', uploadModule);
      formData.append('voucher_no', uploadVoucherNo);
      formData.append('net_amount', uploadAmount || 0);
      formData.append('cost_center_id', uploadCostCenter || 0);
      formData.append('remarks', uploadRemarks);
      formData.append('file', uploadFile);

      await api.post('/vouchers/create-with-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadMessage({ type: 'success', text: 'Invoice uploaded & queued for approval successfully!' });
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadVoucherNo('');
        setUploadAmount('');
        setUploadCostCenter('');
        setUploadRemarks('');
        setUploadMessage(null);
        fetchVouchers();
      }, 1400);
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to upload invoice.',
      });
    } finally {
      setUploadSubmitting(false);
    }
  };

  const openVoucherDetails = async (voucherOrId, initialTab = 'items') => {
    const id = typeof voucherOrId === 'object' ? voucherOrId.ID : voucherOrId;
    if (!id) return;

    setDetailVoucher(typeof voucherOrId === 'object' ? voucherOrId : { ID: id });
    setDetailTab(initialTab);
    setVoucherDetails(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/vouchers/${id}/details`);
      setVoucherDetails(res.data);
      setDetailVoucher(res.data.voucher);
    } catch (err) {
      setDetailError(err.response?.data?.error || 'Unable to load invoice details.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const openRequestedVoucher = (event) => {
      const voucherId = event?.detail?.voucherId || sessionStorage.getItem('openVoucherId');
      const tab = event?.detail?.tab || sessionStorage.getItem('openVoucherTab') || 'items';
      if (!voucherId) return;
      sessionStorage.removeItem('openVoucherId');
      sessionStorage.removeItem('openVoucherTab');
      openVoucherDetails(voucherId, tab);
    };

    window.addEventListener('focusx:open-voucher', openRequestedVoucher);
    if (sessionStorage.getItem('openVoucherId')) openRequestedVoucher();
    return () => window.removeEventListener('focusx:open-voucher', openRequestedVoucher);
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
    } catch {
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
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1500px] mx-auto space-y-6 sm:space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Today’s approval queue</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-950">Good to see you, {(user.Username || user.LoginName || 'there').split(' ')[0]}</h2>
          <p className="mt-1.5 text-sm text-slate-500">Review, verify, and move invoices forward from one focused workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-indigo-700 hover:to-violet-700 hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" /> Upload Invoice
          </button>
          <button onClick={fetchVouchers} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh queue
          </button>
        </div>
      </section>
      {/* Top Welcome Banner & Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="erp-card p-5 flex items-center justify-between overflow-hidden relative">
          <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-indigo-600" />
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
        <div className="erp-card p-5 flex items-center justify-between overflow-hidden relative">
          <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-blue-500" />
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pending Value</p>
            <h3 className="text-xl xl:text-2xl font-black text-slate-900 mt-1">AED {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across all cost centers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="erp-card p-5 flex items-center justify-between overflow-hidden relative">
          <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-amber-500" />
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workflows</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{workflows.length}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {workflows.length} flows across {voucherTypesCount} active modules
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="erp-card p-5 flex items-center justify-between overflow-hidden relative">
          <span className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-emerald-500" />
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
      <div className="erp-card p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSelectedType('all')}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              selectedType === 'all' 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All voucher types ({vouchers.length})
          </button>
          {Array.from(new Set([
            '1281', '771', '2570', '768',
            ...workflows.map(wf => String(wf.VoucherType)).filter(t => t !== '0'),
            ...vouchers.map(v => String(v.VoucherType))
          ])).map(moduleId => {
            const vInfo = getVoucherType(moduleId);
            const count = vouchers.filter(v => String(v.VoucherType) === moduleId).length;
            return (
              <button
                key={moduleId}
                onClick={() => setSelectedType(moduleId)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedType === moduleId
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {vInfo.code} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Voucher # or Header ID..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/create-voucher')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Voucher</span>
          </button>
        </div>
      </div>

      {/* Main Voucher Table / Cards */}
      {loading ? (
        <div className="erp-card p-10 sm:p-16 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-semibold text-slate-500">Querying PostgreSQL & Focus ERP Database...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="erp-card p-10 sm:p-16 text-center">
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
              onClick={() => openVoucherDetails(v)}
              className="erp-card erp-card-hover p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-5 cursor-pointer"
            >
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100/80 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <button type="button" className="text-left text-base sm:text-lg font-extrabold text-slate-900 hover:text-indigo-700 tracking-tight break-all">{v.VoucherNo}</button>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {v.VoucherTypeLabel || getVoucherTypeLabel(v.VoucherType)}
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
                    <div>Net amount: <strong className="text-indigo-700 text-sm font-bold">AED {(v.NetAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></div>
                  </div>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between xl:justify-end gap-4 border-t xl:border-t-0 pt-4 xl:pt-0 border-slate-100">
                <div className="sm:text-right sm:mr-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Level {v.CurrentLevel} Pending
                  </span>
                  {v.DocumentURL && (
                    <button 
                      onClick={(event) => {
                        event.stopPropagation();
                        openVoucherDetails(v, 'document');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-2 flex items-center sm:justify-end gap-1 sm:ml-auto"
                    >
                      <Eye className="w-3 h-3" /> View ERP Document
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openVoucherDetails(v);
                    }}
                    className="col-span-2 sm:col-span-1 min-h-10 px-3 py-2 text-xs font-bold text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Info className="w-4 h-4" /> Details
                  </button>
                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      setActionVoucher(v);
                      setActionType('Reject');
                    }}
                    className="min-h-10 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-all text-xs border border-rose-200 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>

                  <button 
                    onClick={(event) => {
                      event.stopPropagation();
                      setActionVoucher(v);
                      setActionType('Approve');
                    }}
                    className="min-h-10 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
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

      {/* Configured Approval Workflows Overview Section on Dashboard */}
      <div className="erp-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-2xs border border-indigo-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">
                  Configured Approval Workflows
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {workflows.length} Active Flow{workflows.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-level sequential authorization pipelines (supporting up to 10 approval levels)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWorkflowsSection(!showWorkflowsSection)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              {showWorkflowsSection ? 'Collapse' : 'Expand'}
            </button>
            {isSuperUser && (
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 transition-all shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Configure & Edit Workflows</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {showWorkflowsSection && (
          workflows.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-medium">
              No approval workflows configured yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {workflows.map((wf) => {
                const matchedCC = costCenters.find(cc => cc.FocusMasterID === wf.CostCenterID);
                return (
                  <div key={wf.ID} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 hover:border-indigo-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 font-mono">#{wf.ID}</span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{wf.Name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {wf.VoucherType === 0 ? 'Universal (All Types)' : (wf.VoucherTypeLabel || getVoucherTypeLabel(wf.VoucherType))}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            {wf.CostCenterID === 0 ? 'All CC' : (matchedCC?.Name || `CC #${wf.CostCenterID}`)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 text-slate-700">
                            {wf.LevelsCount} Level{wf.LevelsCount > 1 ? 's' : ''} (Max 10)
                          </span>
                        </div>
                      </div>
                      {isSuperUser && (
                        <button
                          onClick={() => navigate('/admin')}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>

                    {/* Sequential Levels Pipeline Preview */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Approval Hierarchy</p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {Array.from({ length: wf.LevelsCount }, (_, idx) => idx + 1).map((lvl) => {
                          const approvers = (wf.Levels || []).filter(l => l.LevelOrder === lvl);
                          return (
                            <div 
                              key={lvl}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-center shrink-0 min-w-[58px]"
                              title={approvers.map(a => a.User?.Username || a.User?.LoginName).join(', ') || 'No approver assigned'}
                            >
                              <span className="text-[9px] font-extrabold text-slate-400 block uppercase">Lvl {lvl}</span>
                              <span className={`text-[10px] font-extrabold block truncate ${approvers.length > 0 ? 'text-indigo-600' : 'text-amber-500'}`}>
                                {approvers.length > 0 ? `${approvers.length} user${approvers.length > 1 ? 's' : ''}` : 'Unset'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Invoice details workspace */}
      <AnimatePresence>
        {detailVoucher && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-6xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center shrink-0"><ReceiptText className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 truncate">{detailVoucher.VoucherNo || 'Invoice details'}</h3>
                      {detailVoucher.ApprovalStatus && <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{detailVoucher.ApprovalStatus} · Level {detailVoucher.CurrentLevel}</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Focus header #{detailVoucher.FocusHeaderID || '—'} · {detailVoucher.VoucherTypeLabel || getVoucherTypeLabel(detailVoucher.VoucherType)}</p>
                  </div>
                </div>
                <button onClick={() => setDetailVoucher(null)} className="icon-button shrink-0" aria-label="Close invoice details"><X className="w-4 h-4" /></button>
              </div>

              <div className="px-4 sm:px-6 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Net amount</p><p className="mt-1 text-sm sm:text-base font-extrabold text-slate-900">AED {(detailVoucher.NetAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">ERP date</p><p className="mt-1 text-sm font-bold text-slate-800">{detailVoucher.Date ? new Date(detailVoucher.Date * 1000).toLocaleDateString() : 'Not available'}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Cost center</p><p className="mt-1 text-sm font-bold text-slate-800">{detailVoucher.CostCenterID || 'Not assigned'}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Created by</p><p className="mt-1 text-sm font-bold text-slate-800">Focus user #{detailVoucher.FocusUserID || '—'}</p></div>
              </div>

              <div className="px-4 sm:px-6 pt-4 border-b border-slate-200 flex gap-1 overflow-x-auto">
                {[
                  ['items', Package, 'Item details'],
                  ['accounts', ReceiptText, 'Accounting'],
                  ['document', Paperclip, 'Document'],
                  ['history', History, 'Approval history']
                ].map(([tab, Icon, label]) => (
                  <button key={tab} onClick={() => setDetailTab(tab)} className={`shrink-0 px-3 sm:px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition ${detailTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                    <Icon className="w-4 h-4" /> {label}
                    {tab === 'items' && voucherDetails && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px]">{voucherDetails.items?.length || 0}</span>}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 min-h-[260px]">
                {detailLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm"><Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-3" />Loading live ERP details…</div>
                ) : detailError ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center"><Info className="w-8 h-8 text-rose-400 mb-3" /><p className="font-bold text-slate-800">Details could not be loaded</p><p className="text-xs text-slate-500 mt-1">{detailError}</p></div>
                ) : detailTab === 'items' ? (
                  voucherDetails?.items?.length ? (
                    <div className="erp-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-left text-xs">
                          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Gross</th></tr></thead>
                          <tbody className="divide-y divide-slate-100">{voucherDetails.items.map((item, index) => (
                            <tr key={item.body_id} className="hover:bg-indigo-50/30"><td className="px-4 py-3 text-slate-400">{item.line_number || index + 1}</td><td className="px-4 py-3"><p className="font-bold text-slate-900">{item.product_name || `Product #${item.product_id}`}</p><p className="text-[10px] text-slate-400 mt-0.5">{item.product_code || `ID ${item.product_id}`}</p></td><td className="px-4 py-3 text-right font-semibold">{item.quantity.toLocaleString()} {item.unit_name}</td><td className="px-4 py-3 text-right">AED {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-4 py-3 text-right font-bold text-slate-900">AED {item.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </div>
                  ) : <div className="h-64 flex flex-col items-center justify-center text-center"><Package className="w-9 h-9 text-slate-300 mb-3" /><p className="font-bold text-slate-700">No inventory item rows</p><p className="text-xs text-slate-400 mt-1">This voucher may contain accounting entries only.</p></div>
                ) : detailTab === 'accounts' ? (
                  voucherDetails?.ledger_entries?.length ? (
                    <div className="grid gap-2.5">{voucherDetails.ledger_entries.map((entry, index) => (
                      <div key={entry.body_id} className="erp-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex gap-3"><span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{entry.line_number || index + 1}</span><div><p className="text-sm font-bold text-slate-900">{entry.account_name || `Account #${entry.account_id}`}</p><p className="text-[10px] text-slate-400">{entry.account_code || `ID ${entry.account_id}`}</p></div></div><div className="flex gap-5 text-right"><div><p className="text-[9px] uppercase font-bold text-slate-400">Amount 1</p><p className="text-xs font-bold">AED {entry.amount_1.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div><div><p className="text-[9px] uppercase font-bold text-slate-400">Amount 2</p><p className="text-xs font-bold">AED {entry.amount_2.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div></div></div>
                    ))}</div>
                  ) : <div className="h-64 flex items-center justify-center text-sm text-slate-400">No accounting rows available.</div>
                ) : detailTab === 'document' ? (
                  detailVoucher.DocumentURL ? (
                    detailVoucher.DocumentURL.toLowerCase().split('?')[0].endsWith('.pdf')
                      ? <iframe src={resolveDocumentUrl(detailVoucher.DocumentURL)} className="w-full h-[58dvh] bg-white rounded-xl border border-slate-200" title={`Document for ${detailVoucher.VoucherNo}`} />
                      : <img src={resolveDocumentUrl(detailVoucher.DocumentURL)} alt={`Document for ${detailVoucher.VoucherNo}`} className="max-h-[58dvh] mx-auto rounded-xl shadow-lg" />
                  ) : <div className="h-64 flex flex-col items-center justify-center text-center"><Paperclip className="w-9 h-9 text-slate-300 mb-3" /><p className="font-bold text-slate-700">No document attached</p><p className="text-xs text-slate-400 mt-1">The ERP record is available, but it has no uploaded file.</p></div>
                ) : voucherDetails?.approval_history?.length ? (
                  <div className="max-w-2xl space-y-3">{voucherDetails.approval_history.map((entry) => (
                    <div key={entry.id} className="erp-card p-4 flex gap-3"><div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${entry.action === 'Reject' || entry.action === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle2 className="w-4 h-4" /></div><div><p className="text-sm font-bold text-slate-900">{entry.action} by {entry.approver || 'ERP user'}</p><p className="text-xs text-slate-500 mt-0.5">Level {entry.level} · {new Date(entry.created_at).toLocaleString()}</p>{entry.remarks && <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5">{entry.remarks}</p>}</div></div>
                  ))}</div>
                ) : <div className="h-64 flex flex-col items-center justify-center text-center"><History className="w-9 h-9 text-slate-300 mb-3" /><p className="font-bold text-slate-700">No approval actions yet</p><p className="text-xs text-slate-400 mt-1">This invoice is waiting for its first decision.</p></div>}
              </div>

              {detailVoucher.ApprovalStatus === 'Pending' && (
                <div className="p-3 sm:px-6 sm:py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
                  <button onClick={() => { setActionVoucher(detailVoucher); setActionType('Reject'); setDetailVoucher(null); }} className="min-h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100">Reject</button>
                  <button onClick={() => { setActionVoucher(detailVoucher); setActionType('Approve'); setDetailVoucher(null); }} className="min-h-10 px-5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Authorize invoice</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal */}
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
                  <h3 className="text-base font-extrabold text-slate-900">ERP Attached Document</h3>
                  <p className="text-xs text-slate-500">Voucher #{previewDoc.VoucherNo} (Header ID: {previewDoc.FocusHeaderID})</p>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-8 text-center min-h-[260px] flex flex-col items-center justify-center">
                  {previewDoc.DocumentURL ? (
                    previewDoc.DocumentURL.endsWith('.pdf') ? (
                      <iframe src={resolveDocumentUrl(previewDoc.DocumentURL)} className="w-full h-[60dvh] rounded-lg border" title="ERP Doc"></iframe>
                    ) : (
                      <img src={resolveDocumentUrl(previewDoc.DocumentURL)} alt="Document" className="max-h-80 mx-auto rounded-lg shadow-xs" />
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
              className="bg-white rounded-2xl max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl"
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

              <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-4 border-t border-slate-100">
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

        {/* Upload Invoice Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-200 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Upload Invoice</h3>
                    <p className="text-xs text-slate-500">Attach document and queue for approval workflow</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUploadModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadMessage && (
                <div className={`mt-4 p-3 rounded-xl text-xs font-medium ${
                  uploadMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {uploadMessage.text}
                </div>
              )}

              <form onSubmit={handleUploadInvoice} className="py-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Module / Voucher Type *
                  </label>
                  <select
                    value={uploadModule}
                    onChange={(e) => setUploadModule(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="1281">MRP (1281) - Material Receipt To Expense</option>
                    <option value="771">DEV (771) - Direct Expense Voucher</option>
                    <option value="2570">CEB (2570) - Cash Expense Booking</option>
                    <option value="768">PUV (768) - Purchases Vouchers</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Voucher # (Optional)
                    </label>
                    <input
                      type="text"
                      value={uploadVoucherNo}
                      onChange={(e) => setUploadVoucherNo(e.target.value)}
                      placeholder="e.g. MRP-2026-001"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Net Amount (AED)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={uploadAmount}
                      onChange={(e) => setUploadAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cost Center
                  </label>
                  <select
                    value={uploadCostCenter}
                    onChange={(e) => setUploadCostCenter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- All Cost Centers (General) --</option>
                    {costCenters.map(cc => (
                      <option key={cc.FocusMasterID || cc.ID} value={cc.FocusMasterID || cc.ID}>
                        {cc.Code ? `${cc.Code} - ` : ''}{cc.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Invoice File (PDF, PNG, JPG) *
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50/50 relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    {uploadFile ? (
                      <p className="text-xs font-bold text-indigo-600 truncate">{uploadFile.name}</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-slate-700">Click or drag & drop invoice document</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF and image files up to 20MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={uploadRemarks}
                    onChange={(e) => setUploadRemarks(e.target.value)}
                    placeholder="Enter invoice details or notes for the approver..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setShowUploadModal(false)} 
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploadSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {uploadSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" /> Upload & Queue
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboard;
