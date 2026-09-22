import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { getVoucherTypeLabel, VOUCHER_TYPE_OPTIONS } from '../lib/voucherTypes';
import {
  Users, Plus, Layers, Trash2, X, Search, UploadCloud, RefreshCw, CheckCircle2, Pencil,
  Building2, Server, Database, Globe, Activity, Check, AlertCircle, FileText, Tag, ToggleLeft, ToggleRight
} from 'lucide-react';

function Admin() {
  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows' | 'users' | 'companies' | 'voucher-types' | 'erp-tester'
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  // Companies & ERP Connection state
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    company_code: '',
    erp_base_url: 'http://192.168.30.7:3101/Focus8API',
    erp_db_name: '',
    erp_db_conn: '',
    is_active: true,
  });
  const [testingConnection, setTestingConnection] = useState({});
  const [testResults, setTestResults] = useState({});
  const [syncingCompany, setSyncingCompany] = useState({});
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  // Voucher Types (Superuser Settings) state
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [loadingVoucherTypes, setLoadingVoucherTypes] = useState(false);
  const [showVoucherTypeModal, setShowVoucherTypeModal] = useState(false);
  const [editingVoucherType, setEditingVoucherType] = useState(null);
  const [voucherTypeForm, setVoucherTypeForm] = useState({
    id: '',
    code: '',
    name: '',
    is_active: true,
  });

  // Workflow Modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [wfName, setWfName] = useState('');
  const [wfVoucherType, setWfVoucherType] = useState(0);
  const [wfCostCenterId, setWfCostCenterId] = useState(0);
  const [wfCostCenterQuery, setWfCostCenterQuery] = useState('');
  const [wfLevelsCount, setWfLevelsCount] = useState(2);

  // Restrictions modal state
  const [selectedUserForRest, setSelectedUserForRest] = useState(null);
  const [userRestrictions, setUserRestrictions] = useState([]);
  const [newRestType, setNewRestType] = useState('cost_center');
  const [newRestId, setNewRestId] = useState('');

  // ERP Upload Tester State
  const [testerHeaderId, setTesterHeaderId] = useState('500');
  const [testerDocUrl, setTesterDocUrl] = useState('/uploads/sample_invoice.pdf');
  const [testerVoucherType, setTesterVoucherType] = useState('1281');
  const [testerFile, setTesterFile] = useState(null);
  const [testerResult, setTesterResult] = useState(null);
  const [testerLoading, setTesterLoading] = useState(false);

  // Search filter and company filter
  const [userSearch, setUserSearch] = useState('');
  const [userCompanyFilter, setUserCompanyFilter] = useState('all');

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const res = await api.get('/companies');
      setCompanies(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const loadVoucherTypes = async () => {
    setLoadingVoucherTypes(true);
    try {
      const res = await api.get('/voucher-types');
      setVoucherTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load voucher types:", err);
    } finally {
      setLoadingVoucherTypes(false);
    }
  };

  const handleOpenVoucherTypeModal = (vt) => {
    if (vt) {
      setEditingVoucherType(vt);
      setVoucherTypeForm({
        id: vt.id ?? vt.ID,
        code: vt.code ?? vt.Code,
        name: vt.name ?? vt.Name,
        is_active: vt.is_active ?? vt.IsActive ?? true,
      });
    } else {
      setEditingVoucherType(null);
      setVoucherTypeForm({
        id: '',
        code: '',
        name: '',
        is_active: true,
      });
    }
    setShowVoucherTypeModal(true);
  };

  const handleSaveVoucherType = async (e) => {
    e.preventDefault();
    try {
      if (editingVoucherType) {
        const vId = editingVoucherType.id ?? editingVoucherType.ID;
        await api.put(`/admin/voucher-types/${vId}`, {
          code: voucherTypeForm.code.trim(),
          name: voucherTypeForm.name.trim(),
          is_active: voucherTypeForm.is_active,
        });
      } else {
        await api.post('/admin/voucher-types', {
          id: parseInt(voucherTypeForm.id, 10),
          code: voucherTypeForm.code.trim(),
          name: voucherTypeForm.name.trim(),
          is_active: voucherTypeForm.is_active,
        });
      }
      setShowVoucherTypeModal(false);
      loadVoucherTypes();
    } catch (err) {
      alert("Failed to save voucher type: " + (err.response?.data?.error || err.message));
    }
  };

  const handleToggleVoucherType = async (vt) => {
    const vId = vt.id ?? vt.ID;
    const currentActive = vt.is_active ?? vt.IsActive ?? true;
    try {
      await api.put(`/admin/voucher-types/${vId}`, {
        is_active: !currentActive,
      });
      loadVoucherTypes();
    } catch (err) {
      alert("Failed to toggle voucher type: " + (err.response?.data?.error || err.message));
    }
  };

  const handleTestConnection = async (companyCode) => {
    setTestingConnection(prev => ({ ...prev, [companyCode]: true }));
    try {
      const res = await api.post(`/companies/${companyCode}/test-connection`);
      setTestResults(prev => ({ ...prev, [companyCode]: res.data }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [companyCode]: {
          db_connected: false,
          db_message: err.response?.data?.error || err.message,
          erp_api_connected: false,
          erp_api_message: "Connection failed",
        }
      }));
    } finally {
      setTestingConnection(prev => ({ ...prev, [companyCode]: false }));
    }
  };

  const handleSyncCompany = async (companyCode) => {
    setSyncingCompany(prev => ({ ...prev, [companyCode]: true }));
    setSyncStatusMsg(`Sync initiated for company ${companyCode}... Fetching users, cost centers, and vouchers.`);
    try {
      await api.post(`/companies/${companyCode}/sync`);
      setTimeout(() => {
        loadData(userCompanyFilter);
        loadCompanies();
        setSyncStatusMsg(`Sync completed for ${companyCode}! Data updated.`);
      }, 3000);
    } catch (err) {
      setSyncStatusMsg(`Sync failed for ${companyCode}: ${err.message}`);
    } finally {
      setSyncingCompany(prev => ({ ...prev, [companyCode]: false }));
    }
  };

  const handleSyncAll = async () => {
    setSyncStatusMsg("Full multi-company synchronization started in background...");
    try {
      await api.post('/companies/sync-all');
      setTimeout(() => {
        loadCompanies();
        loadData('all');
        setSyncStatusMsg("Full multi-company synchronization finished! All data updated.");
      }, 4000);
    } catch (err) {
      setSyncStatusMsg("Sync all failed: " + err.message);
    }
  };

  const handleOpenEditCompany = (comp) => {
    if (comp) {
      setEditingCompany(comp);
      setCompanyForm({
        name: comp.Name || '',
        company_code: comp.CompanyCode || '',
        erp_base_url: comp.ERPBaseURL || 'http://192.168.30.7:3101/Focus8API',
        erp_db_name: comp.ERPDBName || ('Focus8' + comp.CompanyCode),
        erp_db_conn: comp.ERPDBConn || '',
        is_active: comp.IsActive !== false,
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        name: '',
        company_code: '',
        erp_base_url: 'http://192.168.30.7:3101/Focus8API',
        erp_db_name: '',
        erp_db_conn: '',
        is_active: true,
      });
    }
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.CompanyCode}`, companyForm);
      } else {
        await api.post('/companies', companyForm);
      }
      setShowCompanyModal(false);
      loadCompanies();
    } catch (err) {
      alert("Failed to save company: " + (err.response?.data?.error || err.message));
    }
  };

  const loadData = async (compOverride) => {
    try {
      const compParam = compOverride !== undefined ? compOverride : userCompanyFilter;
      const [wfRes, uRes, ccRes] = await Promise.all([
        api.get('/admin/workflows'),
        api.get('/admin/users', { params: { company_code: compParam || 'all' } }),
        api.get('/admin/cost-centers', { params: { company_code: compParam || 'all' } })
      ]);
      setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setCostCenters(Array.isArray(ccRes.data) ? ccRes.data : []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  const handleUserCompanyFilterChange = (newComp) => {
    setUserCompanyFilter(newComp);
    loadData(newComp);
  };

  useEffect(() => {
    loadData();
    loadCompanies();
    loadVoucherTypes();
  }, []);

  // Edit existing workflow
  const handleEditWorkflow = (wf) => {
    setEditingWorkflow(wf);
    setWfName(wf.Name || '');
    setWfVoucherType(wf.VoucherType ?? 0);
    setWfCostCenterId(wf.CostCenterID ?? 0);
    const matched = costCenters.find((cc) => Number(cc.FocusMasterID) === Number(wf.CostCenterID));
    setWfCostCenterQuery(wf.CostCenterID ? (matched ? `${matched.Code ? `${matched.Code} · ` : ''}${matched.Name}` : String(wf.CostCenterID)) : 'Any cost center');
    setWfLevelsCount(wf.LevelsCount || 1);
    setShowWorkflowModal(true);
  };

  // Save / Create Workflow
  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    if (wfCostCenterQuery.trim() && wfCostCenterQuery !== 'Any cost center' && !wfCostCenterId) {
      alert('Choose a cost center from the suggestions, or select “Any cost center”.');
      return;
    }
    try {
      const levelsNum = Math.min(Math.max(parseInt(wfLevelsCount, 10) || 1, 1), 10);
      await api.post('/admin/workflows', {
        id: editingWorkflow ? editingWorkflow.ID : 0,
        name: wfName.trim(),
        voucher_type: parseInt(wfVoucherType, 10) || 0,
        cost_center_id: parseInt(wfCostCenterId, 10) || 0,
        levels_count: levelsNum
      });
      setShowWorkflowModal(false);
      setEditingWorkflow(null);
      setWfName('');
      setWfVoucherType(0);
      setWfCostCenterId(0);
      setWfCostCenterQuery('');
      setWfLevelsCount(2);
      await loadData();
    } catch (err) {
      console.error("Save workflow error:", err);
      alert(err.response?.data?.error || "Failed to save workflow");
    }
  };

  // Assign user to workflow level
  const handleAssignLevelUser = async (workflowId, levelOrder, userId) => {
    if (!userId) return;
    try {
      await api.post('/admin/workflows/levels', {
        workflow_id: workflowId,
        level_order: levelOrder,
        user_id: parseInt(userId)
      });
      loadData();
    } catch {
      alert("Failed to assign user to level");
    }
  };

  // Unassign user from workflow level
  const handleRemoveLevelUser = async (levelRecordId) => {
    try {
      await api.delete(`/admin/workflows/levels/${levelRecordId}`);
      loadData();
    } catch {
      alert("Failed to remove user from level");
    }
  };

  // Delete Workflow
  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workflow?")) return;
    try {
      await api.delete(`/admin/workflows/${id}`);
      loadData();
    } catch {
      alert("Failed to delete workflow");
    }
  };

  // Update User Role
  const handleUpdateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      loadData();
    } catch {
      alert("Failed to update role");
    }
  };

  // Load User Restrictions
  const handleOpenUserRestrictions = async (userObj) => {
    setSelectedUserForRest(userObj);
    const fuid = userObj.focus_user_id ?? userObj.FocusUserID ?? userObj.id ?? userObj.ID;
    try {
      const res = await api.get(`/admin/users/${fuid}/restrictions`);
      setUserRestrictions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setUserRestrictions([]);
    }
  };

  // Add Restriction
  const handleAddRestriction = async (e) => {
    e.preventDefault();
    if (!selectedUserForRest || !newRestId) return;
    const fuid = selectedUserForRest.focus_user_id ?? selectedUserForRest.FocusUserID ?? selectedUserForRest.id ?? selectedUserForRest.ID;
    try {
      await api.post('/admin/restrictions', {
        focus_user_id: fuid,
        restriction_type: newRestType,
        restriction_id: parseInt(newRestId)
      });
      handleOpenUserRestrictions(selectedUserForRest);
      setNewRestId('');
    } catch {
      alert("Failed to add restriction");
    }
  };

  // Remove Restriction
  const handleDeleteRestriction = async (id) => {
    try {
      await api.delete(`/admin/restrictions/${id}`);
      handleOpenUserRestrictions(selectedUserForRest);
    } catch {
      alert("Failed to delete restriction");
    }
  };

  // Run ERP Document Upload Tester
  const handleRunERPTester = async (e) => {
    e.preventDefault();
    setTesterLoading(true);
    setTesterResult(null);

    const formData = new FormData();
    formData.append('voucher_id', testerHeaderId);
    formData.append('document_url', testerDocUrl);
    formData.append('voucher_type', testerVoucherType);
    if (testerFile) {
      formData.append('file', testerFile);
    }

    try {
      const res = await api.post('/erp/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTesterResult(res.data);
    } catch (err) {
      setTesterResult({
        error: err.response?.data?.error || err.message || 'ERP Upload test failed'
      });
    } finally {
      setTesterLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = userSearch.toLowerCase().trim();
    if (!query) return true;
    const uname = (u.username || u.Username || u.login_name || u.LoginName || '').toLowerCase();
    const ukey = (u.user_key || u.UserKey || '').toLowerCase();
    const urole = (u.role || u.Role || '').toLowerCase();
    const ucomp = (u.company_code || u.CompanyCode || '').toLowerCase();
    return uname.includes(query) || ukey.includes(query) || urole.includes(query) || ucomp.includes(query);
  });

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-[1500px] mx-auto space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Control center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-100 text-indigo-700 uppercase border border-indigo-200">
              Admin Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-user workflow hierarchies, cost center rules, user access, and test Focus ERP APIs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('workflows')}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'workflows' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" /> Workflows
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" /> Users ({users.length})
          </button>
          <button
            onClick={() => { setActiveTab('companies'); loadCompanies(); }}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'companies' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" /> Companies & ERP ({companies.length})
          </button>
          <button
            onClick={() => { setActiveTab('voucher-types'); loadVoucherTypes(); }}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'voucher-types' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4" /> Voucher Types ({voucherTypes.length})
          </button>
          <button
            onClick={() => setActiveTab('erp-tester')}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'erp-tester' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" /> ERP API Tester
          </button>
        </div>
      </div>

      {/* TAB 1: WORKFLOWS & MULTI-USER APPROVERS */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-slate-900">Approval Workflows & Multi-User Approvers</h2>
            <button
              onClick={() => {
                setEditingWorkflow(null);
                setWfName('');
                setWfVoucherType(0);
                  setWfCostCenterId(0);
                  setWfCostCenterQuery('');
                setWfLevelsCount(2);
                setShowWorkflowModal(true);
              }}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Create Workflow
            </button>
          </div>

          <div className="space-y-6">
            {workflows.map((wf) => {
              const matchedCostCenter = costCenters.find(cc => cc.FocusMasterID === wf.CostCenterID);
              return (
                <div key={wf.ID} className="erp-card p-4 sm:p-6 space-y-6">
                  {/* Workflow Title */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="w-full sm:w-auto text-lg font-black text-slate-900">{wf.Name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {wf.VoucherType === 0 ? 'All Voucher Types' : (wf.VoucherTypeLabel || getVoucherTypeLabel(wf.VoucherType))}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {wf.CostCenterID === 0 ? 'Any Cost Center' : `CC: ${matchedCostCenter?.Name || wf.CostCenterID}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Total Sequential Levels: {wf.LevelsCount} (Max 10)</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditWorkflow(wf)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/80 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                        title="Edit Workflow"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Workflow</span>
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(wf.ID)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors border border-transparent hover:border-rose-200"
                        title="Delete Workflow"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Level Pipeline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                    {Array.from({ length: wf.LevelsCount }, (_, idx) => idx + 1).map((levelNum) => {
                      const levelUsers = (wf.Levels || []).filter(l => l.LevelOrder === levelNum);
                      return (
                        <div key={levelNum} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Level {levelNum}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              {levelUsers.length} Approver(s)
                            </span>
                          </div>

                          {/* Level Assigned Users List */}
                          <div className="space-y-1.5 min-h-[60px]">
                            {levelUsers.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic pt-2">No approvers assigned</p>
                            ) : (
                              levelUsers.map((lu) => (
                                <div key={lu.ID} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                                  <div className="flex items-center gap-2 truncate">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                      {(lu.User?.Username || lu.User?.username || lu.User?.LoginName || lu.User?.login_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{lu.User?.Username || lu.User?.username || lu.User?.LoginName || lu.User?.login_name || `User #${lu.UserID || lu.user_id}`}</span>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveLevelUser(lu.ID)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                    title="Unassign User"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Quick Assign Dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignLevelUser(wf.ID, levelNum, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="" disabled>+ Add Approver User...</option>
                            {users.map(u => {
                              const uid = u.id || u.ID;
                              const uname = u.username || u.Username || u.login_name || u.LoginName || 'User';
                              const urole = u.role || u.Role || 'normal';
                              return (
                                <option key={uid} value={uid}>
                                  {uname} ({urole})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">ERP Synced Users & Role Control</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredUsers.length} of {users.length} users ({userCompanyFilter === 'all' ? 'All Companies' : `Company ${userCompanyFilter}`})
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
              <select
                value={userCompanyFilter}
                onChange={(e) => handleUserCompanyFilterChange(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">🏢 All Companies ({users.length})</option>
                {companies.map((c) => (
                  <option key={c.CompanyCode} value={c.CompanyCode}>
                    🏢 {c.CompanyCode} - {c.Name}
                  </option>
                ))}
              </select>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter users by name or role..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">User Key (ERP)</th>
                    <th className="py-3 px-4">Login Name</th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Focus User ID</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u) => {
                    const uid = u.id || u.ID;
                    const userName = u.username || u.Username || u.login_name || u.LoginName || 'User';
                    const loginName = u.login_name || u.LoginName || userName;
                    const userKey = u.user_key || u.UserKey || `${u.company_id || u.CompanyID || '8' + (u.company_code || u.CompanyCode || '0D0')}_${loginName}`;
                    const compCode = u.company_code || u.CompanyCode || '0D0';
                    const focusUid = u.focus_user_id ?? u.FocusUserID ?? 0;
                    const role = u.role || u.Role || 'normal';
                    const isSuper = loginName.toLowerCase() === 'su' || userKey.toLowerCase().endsWith('_su') || role.toLowerCase() === 'superuser';

                    return (
                      <tr key={uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p>{userName}</p>
                            {isSuper && (
                              <span className="text-[10px] text-amber-600 font-bold">Superuser Root</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-md">
                            {userKey}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{loginName}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold">
                            {compCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">{focusUid}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={role}
                            onChange={(e) => handleUpdateRole(uid, e.target.value)}
                            className="py-1 px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
                          >
                            <option value="normal">normal</option>
                            <option value="approver">approver</option>
                            <option value="superuser">superuser</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenUserRestrictions(u)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs border border-indigo-200 transition-colors"
                          >
                            Restrictions Matrix
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ERP DOCUMENT UPLOAD & MSSQL SYNC TESTER */}
      {activeTab === 'erp-tester' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              Focus ERP Document Upload & Sync Endpoint Tester
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Simulate ERP document uploads to test endpoint <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-bold">POST /api/erp/upload-document</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Card */}
            <div className="erp-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                ERP Upload Parameters
              </h3>

              <form onSubmit={handleRunERPTester} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Voucher ID / Focus Header ID (MSSQL)
                  </label>
                  <input
                    type="number"
                    value={testerHeaderId}
                    onChange={(e) => setTesterHeaderId(e.target.value)}
                    required
                    placeholder="e.g. 500"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Will query <code className="text-slate-600">Focus80D0.tCore_Header_0 WHERE iHeaderId = {testerHeaderId}</code>
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document File Attachment (Optional Upload)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setTesterFile(e.target.files[0])}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Document Fallback URL / Path
                  </label>
                  <input
                    type="text"
                    value={testerDocUrl}
                    onChange={(e) => setTesterDocUrl(e.target.value)}
                    placeholder="/uploads/sample_doc.pdf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Voucher type
                  </label>
                  <select
                    value={testerVoucherType}
                    onChange={(e) => setTesterVoucherType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {VOUCHER_TYPE_OPTIONS.map((type) => <option key={type.id} value={type.id}>{type.code} - {type.name}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={testerLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {testerLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Querying MSSQL & Syncing...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" /> Trigger ERP Document Sync & Notify
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results Card */}
            <div className="erp-card p-4 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                API Response JSON Output
              </h3>

              {!testerResult ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  Fill out the parameters on the left and click "Trigger ERP Document Sync" to test.
                </div>
              ) : (
                <div className="space-y-3">
                  {testerResult.status === 'success' ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p>{testerResult.message}</p>
                        <p className="text-[11px] font-normal text-emerald-700 mt-0.5">
                          MSSQL Fetched: {testerResult.fetched_from_mssql ? 'YES' : 'NO'} • Notified Users: {testerResult.notified_users_count}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-bold">
                      Error: {testerResult.error || 'Failed'}
                    </div>
                  )}

                  <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-80">
                    {JSON.stringify(testerResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPANIES & MULTI-ERP CONNECTIONS */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="erp-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Focus ERP Companies & Databases
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Configure ERP API endpoints and MSSQL database mappings for each company/subsidiary. Test connections live and synchronize users, cost centers, and vouchers per company.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSyncAll}
                className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5"
                title="Synchronize all active companies from Focus8Erp"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync All Companies</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenEditCompany(null)}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Company</span>
              </button>
            </div>
          </div>

          {/* Sync Status Banner */}
          {syncStatusMsg && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>{syncStatusMsg}</span>
              </div>
              <button onClick={() => setSyncStatusMsg(null)} className="text-indigo-500 hover:text-indigo-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Companies Table */}
          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Company / Entity</th>
                    <th className="py-3 px-4">Database</th>
                    <th className="py-3 px-4">ERP API Base URL</th>
                    <th className="py-3 px-4">Live Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        {loadingCompanies ? "Loading company registry..." : "No companies found. Click 'Sync All Companies' to discover from Focus8Erp."}
                      </td>
                    </tr>
                  ) : (
                    companies.map((comp) => {
                      const testRes = testResults[comp.CompanyCode];
                      const isTesting = testingConnection[comp.CompanyCode];
                      const isSyncing = syncingCompany[comp.CompanyCode];

                      return (
                        <tr key={comp.CompanyCode} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                {comp.CompanyCode}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">{comp.Name}</span>
                                  {comp.IsDefault && (
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">Code: {comp.CompanyCode}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
                              <Database className="w-3.5 h-3.5 text-slate-400" />
                              <span>{comp.ERPDBName || ('Focus8' + comp.CompanyCode)}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-mono text-slate-600 text-[11px]">
                              <Globe className="w-3.5 h-3.5 text-slate-400" />
                              <span className="truncate max-w-xs">{comp.ERPBaseURL || 'http://192.168.30.7:3101/Focus8API'}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {testRes ? (
                              <div className="space-y-1 text-[11px]">
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${testRes.db_connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  <span className={testRes.db_connected ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                                    DB: {testRes.db_connected ? 'OK' : 'Error'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${testRes.erp_api_connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  <span className={testRes.erp_api_connected ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                                    API: {testRes.erp_api_connected ? 'OK' : 'Error'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Not tested</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleTestConnection(comp.CompanyCode)}
                                disabled={isTesting}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Test database and API connection"
                              >
                                <Activity className={`w-3 h-3 text-indigo-600 ${isTesting ? 'animate-spin' : ''}`} />
                                <span>{isTesting ? 'Testing...' : 'Test'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSyncCompany(comp.CompanyCode)}
                                disabled={isSyncing}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                title="Sync users, cost centers, and vouchers for this company"
                              >
                                <RefreshCw className={`w-3 h-3 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditCompany(comp)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Edit Company Config"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: VOUCHER TYPES SETTINGS (SUPERUSER) */}
      {activeTab === 'voucher-types' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">ERP Voucher Types Configuration</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  Superuser Setting
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage all supported invoice and voucher types synced from Focus ERP. Add new types dynamically without system downtime.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadVoucherTypes}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingVoucherTypes ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenVoucherTypeModal(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Voucher Type
              </button>
            </div>
          </div>

          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Type ID</th>
                    <th className="py-3 px-4">Module Code</th>
                    <th className="py-3 px-4">Voucher Description</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {voucherTypes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {loadingVoucherTypes ? 'Loading voucher types...' : 'No voucher types registered.'}
                      </td>
                    </tr>
                  ) : (
                    voucherTypes.map((vt) => {
                      const vId = vt.id ?? vt.ID;
                      const vCode = vt.code ?? vt.Code;
                      const vName = vt.name ?? vt.Name;
                      const vActive = vt.is_active ?? vt.IsActive ?? true;

                      return (
                        <tr key={vId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                            <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200/60 rounded-lg text-xs font-black">
                              {vId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[11px] font-bold">
                              {vCode}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-semibold">{vName}</td>
                          <td className="py-3.5 px-4">
                            {vActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleVoucherType(vt)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                                  vActive
                                    ? 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                                    : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                }`}
                                title={vActive ? "Deactivate Voucher Type" : "Activate Voucher Type"}
                              >
                                {vActive ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenVoucherTypeModal(vt)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Edit Voucher Type"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Type Modal */}
      {showVoucherTypeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingVoucherType ? 'Edit Voucher Type' : 'Add New Voucher Type'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure ERP voucher identification & display rules
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setShowVoucherTypeModal(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucherType} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Voucher Type ID (Focus ERP Header Type)
                </label>
                <input
                  type="number"
                  value={voucherTypeForm.id}
                  onChange={(e) => setVoucherTypeForm({ ...voucherTypeForm, id: e.target.value })}
                  disabled={!!editingVoucherType}
                  placeholder="e.g. 1282 or 3340"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Numeric ID used in ERP table tCore_Header_0 (iVoucherType).
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Code (Short Abbreviation)
                </label>
                <input
                  type="text"
                  value={voucherTypeForm.code}
                  onChange={(e) => setVoucherTypeForm({ ...voucherTypeForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SRN, DPV, DIN"
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Voucher Type Name
                </label>
                <input
                  type="text"
                  value={voucherTypeForm.name}
                  onChange={(e) => setVoucherTypeForm({ ...voucherTypeForm, name: e.target.value })}
                  placeholder="e.g. Service Receipt Note"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vtActive"
                  checked={voucherTypeForm.is_active}
                  onChange={(e) => setVoucherTypeForm({ ...voucherTypeForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="vtActive" className="font-bold text-slate-700 cursor-pointer">
                  Active (sync & process approvals for this type)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoucherTypeModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  {editingVoucherType ? 'Save Changes' : 'Create Voucher Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingWorkflow ? 'Edit Approval Workflow' : 'Create New Approval Workflow'}
                </h3>
                {editingWorkflow && (
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                    Modifying Workflow #{editingWorkflow.ID} • {editingWorkflow.Name}
                  </p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => {
                  setShowWorkflowModal(false);
                  setEditingWorkflow(null);
                }} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Workflow Title</label>
                <input
                  type="text"
                  value={wfName}
                  onChange={(e) => setWfName(e.target.value)}
                  required
                  placeholder="e.g. High Value Purchase Approvals"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Voucher type</label>
                <select
                  value={wfVoucherType}
                  onChange={(e) => setWfVoucherType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={0}>All Voucher Types</option>
                  {VOUCHER_TYPE_OPTIONS.map((type) => <option key={type.id} value={type.id}>{type.code} - {type.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Cost Center Scope</label>
                <input
                  list="workflow-cost-centers"
                  value={wfCostCenterQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWfCostCenterQuery(value);
                    if (value === 'Any cost center') {
                      setWfCostCenterId(0);
                      return;
                    }
                    const match = costCenters.find((cc) => `${cc.Code ? `${cc.Code} · ` : ''}${cc.Name}` === value);
                    setWfCostCenterId(match?.FocusMasterID || '');
                  }}
                  placeholder="Search by cost center name or code"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <datalist id="workflow-cost-centers">
                  <option value="Any cost center" />
                  {costCenters.filter((cc) => Number(cc.FocusMasterID) > 0 && String(cc.Name || '').trim()).map((cc) => (
                    <option key={cc.ID} value={`${cc.Code ? `${cc.Code} · ` : ''}${cc.Name}`} />
                  ))}
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1">Start typing a name or code, then choose a suggestion. Leave this as “Any cost center” for a general workflow.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider">Sequential Levels Count (1 to 10)</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Up to 10 Levels Max
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={wfLevelsCount}
                  onChange={(e) => setWfLevelsCount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">Configure between 1 and 10 sequential approval stages.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkflowModal(false);
                    setEditingWorkflow(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
                >
                  {editingWorkflow ? 'Update Workflow' : 'Save Workflow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restrictions Modal */}
      {selectedUserForRest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">User Restrictions Matrix</h3>
                <p className="text-xs text-slate-500">User: {selectedUserForRest.username || selectedUserForRest.Username || selectedUserForRest.login_name || selectedUserForRest.LoginName}</p>
              </div>
              <button onClick={() => setSelectedUserForRest(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <form onSubmit={handleAddRestriction} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <p className="font-bold text-slate-800">Add Restriction Scope</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={newRestType}
                    onChange={(e) => setNewRestType(e.target.value)}
                    className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="cost_center">Cost Center</option>
                    <option value="module">Voucher Type</option>
                  </select>

                  {newRestType === 'module' ? (
                    <select value={newRestId} onChange={(e) => setNewRestId(e.target.value)} required className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                      <option value="" disabled>Select voucher type…</option>
                      {VOUCHER_TYPE_OPTIONS.map((type) => <option key={type.id} value={type.id}>{type.code} - {type.name}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={newRestId} onChange={(e) => setNewRestId(e.target.value)} placeholder="Focus Cost Center ID" required className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800" />
                  )}

                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="font-bold text-slate-700">Current Assigned Restrictions:</p>
                {userRestrictions.length === 0 ? (
                  <p className="text-slate-400 italic">No restrictions configured (User sees all cost centers).</p>
                ) : (
                  userRestrictions.map((r) => (
                    <div key={r.ID} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900">{r.RestrictionType === 'module' ? 'Voucher Type: ' : 'Cost Center: '}</span>
                        <span className="text-indigo-700">{r.RestrictionType === 'module' ? getVoucherTypeLabel(r.RestrictionID) : `ID #${r.RestrictionID}`}</span>
                      </div>
                      <button onClick={() => handleDeleteRestriction(r.ID)} className="text-rose-500 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={() => setSelectedUserForRest(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingCompany ? `Edit Company: ${editingCompany.CompanyCode}` : 'Register New Company & ERP'}
                </h3>
              </div>
              <button onClick={() => setShowCompanyModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company Code (Focus ERP ID)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCompany}
                  value={companyForm.company_code}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_code: e.target.value })}
                  placeholder="e.g. 010, 040, 0D0"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">3-character Focus ERP company identifier (e.g., 0D0).</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Company Display Name</label>
                <input
                  type="text"
                  required
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  placeholder="e.g. GOC or Fixperts"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Focus8API Base URL</label>
                <input
                  type="text"
                  required
                  value={companyForm.erp_base_url}
                  onChange={(e) => setCompanyForm({ ...companyForm, erp_base_url: e.target.value })}
                  placeholder="http://192.168.30.7:3101/Focus8API"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">ERP MSSQL Database Name</label>
                <input
                  type="text"
                  required
                  value={companyForm.erp_db_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, erp_db_name: e.target.value })}
                  placeholder="e.g. Focus80D0 or Focus8010"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">Direct database name in SQL Server on port 1433.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Custom MSSQL DSN (Optional)</label>
                <input
                  type="text"
                  value={companyForm.erp_db_conn || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, erp_db_conn: e.target.value })}
                  placeholder="sqlserver://sa:P%40ssw0rd@192.168.30.7:1433?database=... (Leave blank to use default server)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave empty to use default SQL server host with the specified Database Name above.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="comp_is_active"
                  checked={companyForm.is_active}
                  onChange={(e) => setCompanyForm({ ...companyForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="comp_is_active" className="font-bold text-slate-700 cursor-pointer">
                  Company is Active (Visible in selector & included in sync)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
                >
                  {editingCompany ? 'Save Changes' : 'Create Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
