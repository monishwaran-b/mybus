import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Check,
  Plus,
  MapPin,
  Bus,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  Phone,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import type { CollegeConfig, Route, BoardingPoint } from '../../types/index.ts';

interface CollegeDatasetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCollegeUpdated?: (college: CollegeConfig) => void;
}

export const CollegeDatasetManagerModal: React.FC<CollegeDatasetManagerModalProps> = ({
  isOpen,
  onClose,
  onCollegeUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'edit-info' | 'add-route' | 'add-stop' | 'import-export'>('presets');
  const [collegeInfo, setCollegeInfo] = useState<CollegeConfig>({
    collegeId: 'anna-univ-ceg',
    collegeName: 'Anna University - CEG & MIT Campuses',
    shortName: 'Anna Univ',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai',
    campusAddress: 'Sardar Patel Road, Guindy, Chennai, Tamil Nadu 600025',
    helplinePhone: '+91 44 2235 7004',
  });

  const [presets, setPresets] = useState<Array<{
    id: string;
    name: string;
    district: string;
    city: string;
    routesCount: number;
    busesCount: number;
    description: string;
  }>>([]);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [editCollegeName, setEditCollegeName] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Add route form
  const [newRouteName, setNewRouteName] = useState('');
  const [newRouteCode, setNewRouteCode] = useState('');
  const [newRouteStart, setNewRouteStart] = useState('');
  const [newRouteEnd, setNewRouteEnd] = useState('');

  // Add stop form
  const [newStopName, setNewStopName] = useState('');
  const [selectedRouteForStop, setSelectedRouteForStop] = useState('');
  const [newStopTime, setNewStopTime] = useState('07:30 AM');

  // JSON import/export
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [colRes, routesRes] = await Promise.all([
        api.getCollegeInfo(),
        api.getRoutes(),
      ]);

      setCollegeInfo(colRes.college);
      setPresets(colRes.presets);
      setRoutes(routesRes.data);

      setEditCollegeName(colRes.college.collegeName);
      setEditDistrict(colRes.college.district);
      setEditCity(colRes.college.city);
      setEditAddress(colRes.college.campusAddress);
      setEditPhone(colRes.college.helplinePhone);

      if (routesRes.data.length > 0) {
        setSelectedRouteForStop(routesRes.data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = async (presetId: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.setCollegePreset(presetId);
      setCollegeInfo(res.college);
      setEditCollegeName(res.college.collegeName);
      setEditDistrict(res.college.district);
      setEditCity(res.college.city);
      setEditAddress(res.college.campusAddress);
      setEditPhone(res.college.helplinePhone);

      setStatusMsg({
        text: `Switched college dataset to: ${res.college.collegeName}`,
        type: 'success',
      });

      if (onCollegeUpdated) {
        onCollegeUpdated(res.college);
      }
    } catch (e) {
      setStatusMsg({ text: 'Failed to apply preset', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCollegeInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.updateCollegeInfo({
        collegeName: editCollegeName,
        district: editDistrict,
        city: editCity,
        campusAddress: editAddress,
        helplinePhone: editPhone,
      });

      setCollegeInfo(res.college);
      setStatusMsg({
        text: `College details saved: ${res.college.collegeName}`,
        type: 'success',
      });

      if (onCollegeUpdated) {
        onCollegeUpdated(res.college);
      }
    } catch (e) {
      setStatusMsg({ text: 'Failed to update college information', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteName) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.addCustomRoute({
        name: newRouteName,
        code: newRouteCode || `RT-0${routes.length + 1}`,
        startPoint: newRouteStart || 'City Center',
        endPoint: newRouteEnd || collegeInfo.collegeName,
        description: `Bus line from ${newRouteStart || 'City'} to ${collegeInfo.collegeName}`,
      });

      setRoutes((prev) => [...prev, res.route]);
      setNewRouteName('');
      setNewRouteCode('');
      setNewRouteStart('');
      setNewRouteEnd('');
      setStatusMsg({ text: `New route added: ${res.route.name}`, type: 'success' });
    } catch (e) {
      setStatusMsg({ text: 'Failed to add custom route', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopName || !selectedRouteForStop) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.addCustomStop({
        name: newStopName,
        routeId: selectedRouteForStop,
        scheduledTime: newStopTime,
      });

      setNewStopName('');
      setStatusMsg({ text: `Bus stop added: ${res.stop.name}`, type: 'success' });
    } catch (e) {
      setStatusMsg({ text: 'Failed to add stop', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    const exportData = {
      college: collegeInfo,
      routes: routes.map((r) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        startPoint: r.startPoint,
        endPoint: r.endPoint,
      })),
      timestamp: new Date().toISOString(),
    };
    setJsonText(JSON.stringify(exportData, null, 2));
    setStatusMsg({ text: 'Exported dataset generated below. You can copy it or save it.', type: 'success' });
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      const res = await api.uploadCollegeDataset(parsed);
      setStatusMsg({ text: res.message || 'Dataset imported successfully!', type: 'success' });
      loadData();
    } catch (e: any) {
      setStatusMsg({ text: `Invalid JSON format: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  My College Bus Dataset
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                  Tamil Nadu
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Currently tracking: <strong className="text-slate-900">{collegeInfo.collegeName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-200 bg-white overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('presets');
              setStatusMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            1. Select College Preset
          </button>

          <button
            onClick={() => {
              setActiveTab('edit-info');
              setStatusMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'edit-info'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            2. Edit College Name & Info
          </button>

          <button
            onClick={() => {
              setActiveTab('add-route');
              setStatusMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add-route'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            3. Add Bus Route
          </button>

          <button
            onClick={() => {
              setActiveTab('add-stop');
              setStatusMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'add-stop'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            4. Add Bus Stop
          </button>

          <button
            onClick={() => {
              setActiveTab('import-export');
              setStatusMsg(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'import-export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            5. Import / Export Data
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: College Presets */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Pick Your Tamil Nadu College or University
                </h3>
                <p className="text-xs text-slate-500">
                  Choose your college to instantly load its routes, campus bus lines, and stop timetables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {presets.map((preset) => {
                  const isCurrent = collegeInfo.collegeId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                            {preset.district}
                          </span>
                          {isCurrent && (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">
                          {preset.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-200/60">
                        <span>{preset.routesCount} Campus Routes</span>
                        <span>{preset.busesCount} Buses</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Edit College Information */}
          {activeTab === 'edit-info' && (
            <form onSubmit={handleSaveCollegeInfo} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Custom College Name & Campus Location
                </h3>
                <p className="text-xs text-slate-500">
                  Enter your exact college name and campus contact details in Tamil Nadu.
                </p>
              </div>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">College / University Name</label>
                  <input
                    type="text"
                    required
                    value={editCollegeName}
                    onChange={(e) => setEditCollegeName(e.target.value)}
                    placeholder="e.g. Sri Venkateswara College of Engineering"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">District in Tamil Nadu</label>
                    <input
                      type="text"
                      required
                      value={editDistrict}
                      onChange={(e) => setEditDistrict(e.target.value)}
                      placeholder="e.g. Kanchipuram / Chennai / Coimbatore"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Campus City / Town</label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder="e.g. Sriperumbudur / Chennai"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Full Campus Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="e.g. Pennalur, Sriperumbudur, Tamil Nadu 602117"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">College Bus Office Helpline Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="e.g. +91 44 2715 2000"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save College Information</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 3: Add Bus Route */}
          {activeTab === 'add-route' && (
            <form onSubmit={handleAddRoute} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Add a New Bus Route for Your College
                </h3>
                <p className="text-xs text-slate-500">
                  Create a new line connecting your town or neighborhood to campus.
                </p>
              </div>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Route Name</label>
                  <input
                    type="text"
                    required
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    placeholder="e.g. Route 6 - Chengalpattu to Campus"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Route Code</label>
                    <input
                      type="text"
                      value={newRouteCode}
                      onChange={(e) => setNewRouteCode(e.target.value)}
                      placeholder="e.g. RT-06"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Starting Point</label>
                    <input
                      type="text"
                      value={newRouteStart}
                      onChange={(e) => setNewRouteStart(e.target.value)}
                      placeholder="e.g. Chengalpattu Old Bus Stand"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Destination</label>
                  <input
                    type="text"
                    value={newRouteEnd}
                    onChange={(e) => setNewRouteEnd(e.target.value)}
                    placeholder={`e.g. ${collegeInfo.collegeName} Terminal`}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Route to Fleet</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 4: Add Bus Stop */}
          {activeTab === 'add-stop' && (
            <form onSubmit={handleAddStop} className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Add a Bus Stop to an Existing Route
                </h3>
                <p className="text-xs text-slate-500">
                  Add your local pickup point with morning arrival time.
                </p>
              </div>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Select Route</label>
                  <select
                    value={selectedRouteForStop}
                    onChange={(e) => setSelectedRouteForStop(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-semibold"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Bus Stop Name</label>
                  <input
                    type="text"
                    required
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    placeholder="e.g. Guduvanchery Signal / Chromepet MIT Gate"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Morning Pickup Time</label>
                  <input
                    type="text"
                    value={newStopTime}
                    onChange={(e) => setNewStopTime(e.target.value)}
                    placeholder="e.g. 07:15 AM"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Save Bus Stop</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 5: Import / Export JSON */}
          {activeTab === 'import-export' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Import or Export College Dataset
                </h3>
                <p className="text-xs text-slate-500">
                  Share your college bus dataset with friends or import custom routes in JSON format.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleExportJson}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Current Dataset</span>
                </button>

                <button
                  onClick={handleImportJson}
                  disabled={!jsonText.trim() || loading}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>Apply Imported Dataset</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste or view your college JSON dataset here..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>State: Tamil Nadu · College Bus Tracking</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
