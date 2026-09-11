import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, UploadCloud, Plus, Trash2, CheckCircle2, AlertCircle, 
  ArrowLeft, Eye, X, Building, Calendar, DollarSign, Layers,
  Receipt, ShieldCheck, Sparkles, RefreshCw, Hash
} from 'lucide-react';
import clsx from 'clsx';
import api from '../lib/api';

const VOUCHER_TYPE_METADATA = {
  1281: {
    code: 'MRP',
    name: 'Material Receipt To Expense',
    account: 'Budget Committed',
    entity: 'GOC DXB',
    description: 'Material receipts expensed directly against project budget lines.',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeRing: 'ring-emerald-500 border-emerald-500 shadow-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  771: {
    code: 'DEV',
    name: 'Direct Expense Voucher',
    account: 'Budget Expensed',
    entity: 'TerraCore DXB',
    description: 'Direct site expenses, equipment rentals, service billing.',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeRing: 'ring-indigo-500 border-indigo-500 shadow-indigo-500/10',
    iconColor: 'text-indigo-600',
  },
  2570: {
    code: 'CEB',
    name: 'Cash Expense Booking',
    account: 'Budget Expensed',
    entity: 'GOC DXB',
    description: 'Petty cash booking, worker advances, urgent site supplies.',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    activeRing: 'ring-amber-500 border-amber-500 shadow-amber-500/10',
    iconColor: 'text-amber-600',
  },
  768: {
    code: 'PUV',
    name: 'Purchases Vouchers',
    account: 'Accrued Supplier Expenses',
    entity: 'GOC DXB',
    description: 'Supplier purchase invoicing linked to material receipts.',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    activeRing: 'ring-blue-500 border-blue-500 shadow-blue-500/10',
    iconColor: 'text-blue-600',
  },
};

export default function CreateVoucher({ user }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form states
  const [selectedType, setSelectedType] = useState(1281);
  const [docNo, setDocNo] = useState('');
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('GOC DXB');
  const [isFetchingVNo, setIsFetchingVNo] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [costCenterName, setCostCenterName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // File upload state
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState([
    {
      item_name: 'Adhesive Epoxy Anchor - HIT-RE500V3 (330ml Each)',
      unit: 'Each',
      quantity: 1,
      rate: 191.26,
      description: 'Project site supplies',
      wbs_section: '01 60057',
      wbs_phase: '0101 60057',
      wbs_activity: '0101020 60057',
      division: 'CV',
    },
  ]);

  // Master options state
  const [options, setOptions] = useState({
    cost_centers: [],
    vendors: [],
    products: [],
    units: [],
    entities: [],
  });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Load master options on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoadingOptions(true);
        const res = await api.get('/vouchers/master-options');
        setOptions({
          cost_centers: res.data?.cost_centers || [],
          vendors: res.data?.vendors || [],
          products: res.data?.products || [],
          units: res.data?.units || [],
          entities: res.data?.entities || [],
        });

        // Auto-select first cost center if available
        if (res.data?.cost_centers?.length > 0) {
          const firstCC = res.data.cost_centers[0];
          setCostCenterId(firstCC.id);
          setCostCenterName(firstCC.name);
        }
      } catch (err) {
        console.error('Failed to load master options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  // Sync default entity when selectedType changes
  useEffect(() => {
    const meta = VOUCHER_TYPE_METADATA[selectedType];
    if (meta?.entity) {
      setSelectedEntity(meta.entity);
    }
  }, [selectedType]);

  // Auto-generate Focus ERP next voucher sequence number whenever type or entity changes
  const fetchNextVoucherNo = useCallback(async (type, entity) => {
    try {
      setIsFetchingVNo(true);
      const targetEntity = entity || VOUCHER_TYPE_METADATA[type]?.entity || 'GOC DXB';
      const res = await api.get(`/vouchers/next-number?voucher_type=${type}&entity=${encodeURIComponent(targetEntity)}`);
      if (res.data?.next_voucher_no) {
        setDocNo(res.data.next_voucher_no);
      }
    } catch (err) {
      console.error('Failed to fetch next voucher number from Focus ERP:', err);
    } finally {
      setIsFetchingVNo(false);
    }
  }, []);

  useEffect(() => {
    fetchNextVoucherNo(selectedType, selectedEntity);
  }, [selectedType, selectedEntity, fetchNextVoucherNo]);

  // Handle file selection
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(selected);
      } else {
        setFilePreview('');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Line item handlers
  const updateLineItem = (index, field, value) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        item_name: 'General Service / Expense',
        unit: 'Each',
        quantity: 1,
        rate: 500,
        description: '',
        wbs_section: '01 60057',
        wbs_phase: '0101 60057',
        wbs_activity: '0101020 60057',
        division: 'CV',
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Computations
  const totalGross = lineItems.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.rate) || 0), 0);
  const totalVAT = totalGross * 0.05; // 5% UAE standard recoverable VAT
  const totalNet = totalGross + totalVAT;

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessResult(null);

    if (!vendorName.trim()) {
      setErrorMsg('Please enter or select a Vendor / Supplier name.');
      return;
    }

    if (!costCenterId && !costCenterName) {
      setErrorMsg('Please select an authorized Cost Center.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('voucher_type', selectedType.toString());
      formData.append('voucher_no', docNo);
      formData.append('vendor_invoice_no', vendorInvoiceNo);
      
      // Format date to DD/MM/YYYY for Focus ERP API
      const [year, month, day] = date.split('-');
      formData.append('date', `${day}/${month}/${year}`);

      formData.append('net_amount', totalNet.toFixed(2));
      formData.append('cost_center_id', costCenterId.toString());
      formData.append('cost_center_name', costCenterName);
      formData.append('vendor_name', vendorName);
      formData.append('purchase_ac', VOUCHER_TYPE_METADATA[selectedType]?.account || 'Budget Expensed');
      formData.append('entity', selectedEntity || VOUCHER_TYPE_METADATA[selectedType]?.entity || 'GOC DXB');
      formData.append('remarks', remarks);

      // Line items with calculated gross
      const preparedItems = lineItems.map((it) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate) || 0;
        return {
          ...it,
          quantity: qty,
          rate: rate,
          gross: qty * rate,
          tax_code: 'Standard Rated Purchase - Recoverable',
        };
      });
      formData.append('line_items', JSON.stringify(preparedItems));

      if (file) {
        formData.append('file', file);
      }

      const res = await api.post('/vouchers/create-with-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessResult(res.data);
    } catch (err) {
      console.error('Failed to create voucher:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create voucher.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const currentMeta = VOUCHER_TYPE_METADATA[selectedType];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Approvals Queue
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            Create New Voucher
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3 h-3" /> Focus 8 ERP
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose voucher type, enter line-item expenses, and upload invoice proof for approval.
          </p>
        </div>

        {/* Total Badge */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl shadow-slate-900/10 min-w-[200px]">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Payable (Inc. 5% VAT)</p>
          <p className="text-2xl font-black text-emerald-400 mt-0.5">AED {totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Success Modal */}
      {successResult && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-emerald-950 shadow-xl shadow-emerald-500/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-emerald-900">Voucher Created Successfully!</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Voucher #{successResult.voucher?.VoucherNo} has been created and routed to Level 1 approvers.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessResult(null)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 rounded-xl p-3 text-xs border border-emerald-200/60">
            <div>
              <span className="text-slate-400 block font-medium">Voucher Type</span>
              <span className="font-bold text-slate-800">{successResult.voucher?.VoucherTypeLabel}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Document URL</span>
              {successResult.document_url ? (
                <a
                  href={`http://localhost:4210${successResult.document_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> View Proof
                </a>
              ) : (
                <span className="text-slate-400">None</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Focus Header ID</span>
              <span className="font-mono font-bold text-slate-800">{successResult.voucher?.FocusHeaderID}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Approval Status</span>
              <span className="font-bold text-amber-600">Pending Level 1</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              View in Approvals Queue
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccessResult(null);
                setDocNo(`${currentMeta.code}-${Date.now().toString().slice(-6)}`);
                removeFile();
              }}
              className="px-4 py-2 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
            >
              Create Another Voucher
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-900 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="ml-auto text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Voucher Type */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</span>
              Select Voucher Type
            </label>
            <span className="text-xs text-slate-400 font-medium">Supported in Focus 8 ERP & Workflows</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(VOUCHER_TYPE_METADATA).map(([typeIdStr, meta]) => {
              const typeId = Number(typeIdStr);
              const isSelected = selectedType === typeId;
              return (
                <div
                  key={typeId}
                  onClick={() => setSelectedType(typeId)}
                  className={clsx(
                    'relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 bg-white hover:border-slate-300',
                    isSelected 
                      ? `${meta.activeRing} ring-2 ring-offset-2 ring-offset-slate-50` 
                      : 'border-slate-200/80 hover:shadow-md'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-md border', meta.badgeBg)}>
                      {meta.code} • {typeId}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-2">{meta.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{meta.description}</p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Default Account:</span>
                    <span className="font-bold text-slate-700">{meta.account}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Invoice Proof / Document Upload */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">2</span>
              Upload Invoice Proof / Receipt
            </label>
            <span className="text-xs text-slate-400">Accepted: PNG, JPG, WebP, PDF</span>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
              file 
                ? 'border-indigo-300 bg-indigo-50/30' 
                : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {!file ? (
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag & drop invoice image
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Uploaded file will be attached directly to the ERP voucher & approval inspection window
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 max-w-xl mx-auto text-left" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Invoice preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      PDF
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-extrabold text-slate-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready for upload</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Attached
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Header Details Form */}
        <div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">3</span>
              Voucher Header Information
            </label>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {currentMeta.code} - {currentMeta.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Auto ERP Voucher Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  ERP Voucher No. <span className="text-rose-500">*</span>
                </label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Sparkles className="w-2.5 h-2.5" />
                  ERP Auto-Series
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder="Auto-generating..."
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold text-slate-900 tracking-wider outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => fetchNextVoucherNo(selectedType, selectedEntity)}
                  title="Refresh next available number from ERP"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", isFetchingVNo && "animate-spin text-indigo-600")} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Generated from Focus 8 series: {selectedEntity} ({selectedEntity === 'TerraCore DXB' ? '66' : selectedEntity === 'GOC AUH' ? '61' : '60'})
              </p>
            </div>

            {/* Vendor / Supplier Paper Invoice Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Vendor Invoice / Bill No.
                </label>
                <span className="text-[10px] text-slate-400 font-medium">From physical bill</span>
              </div>
              <input
                type="text"
                value={vendorInvoiceNo}
                onChange={(e) => setVendorInvoiceNo(e.target.value)}
                placeholder="e.g. INV-90241 / HILTI-088"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Supplier reference printed on the attached invoice.
              </p>
            </div>

            {/* Entity / Operating Company */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Entity / Operating Company <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all bg-white"
              >
                {options.entities?.length > 0 ? (
                  options.entities.map((ent) => (
                    <option key={ent.id} value={ent.name}>
                      {ent.name} ({ent.code})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="GOC DXB">GOC DXB (GD - Series 60)</option>
                    <option value="TerraCore DXB">TerraCore DXB (TD - Series 66)</option>
                    <option value="GOC AUH">GOC AUH (GA - Series 61)</option>
                  </>
                )}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Drives the ERP voucher series numbering.
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Voucher Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all"
              />
            </div>

            {/* Cost Center */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cost Center <span className="text-rose-500">*</span>
              </label>
              <select
                value={costCenterId}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  setCostCenterId(selectedId);
                  const found = options.cost_centers.find((c) => c.id === selectedId);
                  if (found) setCostCenterName(found.name);
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all bg-white"
              >
                <option value="">-- Select Cost Center --</option>
                {options.cost_centers.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor / Supplier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vendor / Supplier Account <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="vendors-datalist"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Search or enter vendor name..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all"
              />
              <datalist id="vendors-datalist">
                {options.vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.code}
                  </option>
                ))}
              </datalist>
            </div>

            {/* Debit Account / Book */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expense / Booking Account
              </label>
              <input
                type="text"
                value={currentMeta.account}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-semibold outline-none"
              />
            </div>

            {/* Remarks / Narration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Comments / Narration
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Invoice reference, purpose, site location..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Dynamic Line Items Table */}
        <div className="space-y-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">4</span>
                Expense Line Items
              </label>
              <p className="text-xs text-slate-400 mt-0.5">Include quantity, unit rates, and project WBS tags.</p>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-2">#</th>
                  <th className="py-2.5 px-2 min-w-[200px]">Item / Description</th>
                  <th className="py-2.5 px-2 min-w-[90px]">Unit</th>
                  <th className="py-2.5 px-2 min-w-[90px]">Qty</th>
                  <th className="py-2.5 px-2 min-w-[110px]">Unit Rate (AED)</th>
                  <th className="py-2.5 px-2 min-w-[110px]">Gross (AED)</th>
                  <th className="py-2.5 px-2 min-w-[130px]">WBS Section</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {lineItems.map((item, idx) => {
                  const qty = Number(item.quantity) || 0;
                  const rate = Number(item.rate) || 0;
                  const gross = qty * rate;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-2 font-bold text-slate-400">{idx + 1}</td>
                      
                      {/* Item Name */}
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          list="products-datalist"
                          value={item.item_name}
                          onChange={(e) => updateLineItem(idx, 'item_name', e.target.value)}
                          placeholder="Select or enter item..."
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-semibold"
                        />
                      </td>

                      {/* Unit */}
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateLineItem(idx, 'unit', e.target.value)}
                          placeholder="Each / Day"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-semibold"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-semibold text-right"
                        />
                      </td>

                      {/* Rate */}
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.rate}
                          onChange={(e) => updateLineItem(idx, 'rate', e.target.value)}
                          required
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-semibold text-right"
                        />
                      </td>

                      {/* Gross Amount (Computed) */}
                      <td className="py-2.5 px-2 font-bold text-slate-800 text-right">
                        {gross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* WBS Section */}
                      <td className="py-2.5 px-2">
                        <input
                          type="text"
                          value={item.wbs_section}
                          onChange={(e) => updateLineItem(idx, 'wbs_section', e.target.value)}
                          placeholder="01 60057"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-semibold"
                        />
                      </td>

                      {/* Delete Row */}
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={lineItems.length === 1}
                          className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <datalist id="products-datalist">
            {options.products.map((p) => (
              <option key={p.id} value={p.name}>
                {p.code}
              </option>
            ))}
          </datalist>

          {/* Subtotal Summary Box */}
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-end">
            <div className="w-full sm:w-80 space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal (Gross):</span>
                <span className="font-bold text-slate-800">AED {totalGross.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Recoverable VAT (5%):</span>
                <span className="font-bold text-slate-800">AED {totalVAT.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Total Net Payable:</span>
                <span className="text-indigo-600">AED {totalNet.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting to Focus ERP...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Create & Route for Approval
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
