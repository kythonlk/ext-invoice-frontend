import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { getVoucherTypeLabel, VOUCHER_TYPE_OPTIONS } from '../lib/voucherTypes';
import {
  Users, Plus, Layers, Trash2, X, Search, UploadCloud, RefreshCw, CheckCircle2
} from 'lucide-react';

function Admin() {
  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows' | 'users' | 'restrictions' | 'erp-tester'
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);

  // Workflow Modal state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [wfName, setWfName] = useState('');
  const [wfVoucherType, setWfVoucherType] = useState(0);
  const [wfCostCenterId, setWfCostCenterId] = useState(0);
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

  // Search filter
  const [userSearch, setUserSearch] = useState('');

  const loadData = async () => {
    try {
      const [wfRes, uRes, ccRes] = await Promise.all([
        api.get('/admin/workflows'),
        api.get('/admin/users'),
        api.get('/admin/cost-centers')
      ]);
      setWorkflows(Array.isArray(wfRes.data) ? wfRes.data : []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : []);
      setCostCenters(Array.isArray(ccRes.data) ? ccRes.data : []);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save / Create Workflow
  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/workflows', {
        id: editingWorkflow ? editingWorkflow.ID : 0,
        name: wfName,
        voucher_type: parseInt(wfVoucherType),
        cost_center_id: parseInt(wfCostCenterId),
        levels_count: parseInt(wfLevelsCount)
      });
      setShowWorkflowModal(false);
      setEditingWorkflow(null);
      setWfName('');
      loadData();
    } catch {
      alert("Failed to save workflow");
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
    try {
      const res = await api.get(`/admin/users/${userObj.FocusUserID}/restrictions`);
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
    try {
      await api.post('/admin/restrictions', {
        focus_user_id: selectedUserForRest.FocusUserID,
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
    const query = userSearch.toLowerCase();
    return (u.Username && u.Username.toLowerCase().includes(query)) ||
           (u.LoginName && u.LoginName.toLowerCase().includes(query)) ||
           (u.Role && u.Role.toLowerCase().includes(query));
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
                      <p className="text-xs text-slate-400 mt-1">Total Sequential Levels: {wf.LevelsCount}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteWorkflow(wf.ID)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visual Level Pipeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                      {(lu.User?.Username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{lu.User?.Username || lu.User?.LoginName || `User #${lu.UserID}`}</span>
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
                            {users.map(u => (
                              <option key={u.ID} value={u.ID}>
                                {u.Username || u.LoginName} ({u.Role || 'normal'})
                              </option>
                            ))}
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
            <h2 className="text-base font-extrabold text-slate-900">ERP Synced Users & Role Control</h2>
            
            <div className="relative w-full md:w-80">
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

          <div className="erp-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Login Name</th>
                    <th className="py-3 px-4">Focus User ID</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredUsers.map((u) => (
                    <tr key={u.ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {(u.Username || u.LoginName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p>{u.Username || u.LoginName}</p>
                          {u.LoginName === 'su' && (
                            <span className="text-[10px] text-amber-600 font-bold">Superuser Root</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{u.LoginName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{u.FocusUserID}</td>
                      <td className="py-3.5 px-4">
                        <select
                          value={u.Role || 'normal'}
                          onChange={(e) => handleUpdateRole(u.ID, e.target.value)}
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
                  ))}
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

      {/* Workflow Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto w-full p-4 sm:p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Create New Approval Workflow</h3>
              <button onClick={() => setShowWorkflowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
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
                <select
                  value={wfCostCenterId}
                  onChange={(e) => setWfCostCenterId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={0}>Any Cost Center (All)</option>
                  {costCenters.map(cc => (
                    <option key={cc.ID} value={cc.FocusMasterID}>
                      {cc.Name} ({cc.Code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Sequential Levels Count</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={wfLevelsCount}
                  onChange={(e) => setWfLevelsCount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWorkflowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                >
                  Save Workflow
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
                <p className="text-xs text-slate-500">User: {selectedUserForRest.Username || selectedUserForRest.LoginName}</p>
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
    </div>
  );
}

export default Admin;
