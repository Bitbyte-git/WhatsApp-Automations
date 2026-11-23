import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Smartphone,
  ExternalLink,
  PhoneCall,
  Check,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface SubOption {
  id: string;
  label: string;
  response: string;
}

interface MainButtonFlow {
  id: string;
  buttonLabel: string;
  followUpPrompt: string;
  subOptions: SubOption[];
}

export const ButtonReplyView: React.FC = () => {
  const { user } = useAuth();
  const [welcomePrompt, setWelcomePrompt] = useState('Welcome! Please select the service you are looking for:');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testingPhone, setTestingPhone] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Flow State: Configurable by the client
  const [flows, setFlows] = useState<MainButtonFlow[]>([
    {
      id: 'f1',
      buttonLabel: 'Wedding Photography',
      followUpPrompt: 'Please choose your preferred session time:',
      subOptions: [
        { id: 's1', label: 'Morning Session', response: 'Noted Morning Session! We will check photographer availability.' },
        { id: 's2', label: 'Afternoon Session', response: 'Noted Afternoon Session! Our team will contact you with package details.' },
        { id: 's3', label: 'Night Reception', response: 'Noted Night Reception! Exclusive cinematic lighting setup included.' },
      ],
    },
    {
      id: 'f2',
      buttonLabel: 'Outdoor Couple Shoot',
      followUpPrompt: 'Choose your preferred shoot location:',
      subOptions: [
        { id: 's4', label: 'Yercaud Hills', response: 'Scenic hills & lake shoot package selected!' },
        { id: 's5', label: 'Studio Garden', response: 'Private studio garden setup selected!' },
      ],
    },
  ]);

  const [activeFlowId, setActiveFlowId] = useState<string>('f1');
  const [newButtonLabel, setNewButtonLabel] = useState('');

  // Sub-option input state
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubResponse, setNewSubResponse] = useState('');

  // Live Phone Simulator State
  const [simStep, setSimStep] = useState<number>(1);
  const [selectedMainBtn, setSelectedMainBtn] = useState<MainButtonFlow | null>(null);
  const [selectedSubOpt, setSelectedSubOpt] = useState<SubOption | null>(null);

  const activeFlow = flows.find((f) => f.id === activeFlowId) || flows[0];

  const handleAddMainFlow = () => {
    if (!newButtonLabel.trim() || flows.length >= 3) return;
    const newFlow: MainButtonFlow = {
      id: `f_${Date.now()}`,
      buttonLabel: newButtonLabel.trim(),
      followUpPrompt: 'Please choose an option:',
      subOptions: [],
    };
    setFlows([...flows, newFlow]);
    setActiveFlowId(newFlow.id);
    setNewButtonLabel('');
  };

  const handleRemoveMainFlow = (id: string) => {
    const updated = flows.filter((f) => f.id !== id);
    setFlows(updated);
    if (updated.length > 0) setActiveFlowId(updated[0].id);
  };

  const handleAddSubOption = () => {
    if (!newSubLabel.trim() || !activeFlow) return;
    const newSub: SubOption = {
      id: `s_${Date.now()}`,
      label: newSubLabel.trim(),
      response: newSubResponse.trim() || `Thank you for selecting ${newSubLabel.trim()}! We will contact you shortly.`,
    };

    const updatedFlows = flows.map((f) => {
      if (f.id === activeFlow.id) {
        return { ...f, subOptions: [...f.subOptions, newSub] };
      }
      return f;
    });

    setFlows(updatedFlows);
    setNewSubLabel('');
    setNewSubResponse('');
  };

  const handleRemoveSubOption = (subId: string) => {
    if (!activeFlow) return;
    const updatedFlows = flows.map((f) => {
      if (f.id === activeFlow.id) {
        return { ...f, subOptions: f.subOptions.filter((s) => s.id !== subId) };
      }
      return f;
    });
    setFlows(updatedFlows);
  };

  const handleLiveTest = async () => {
    if (!testPhoneNumber.trim()) {
      setAlertError('Please enter a test phone number.');
      return;
    }
    setTestingPhone(true);
    setAlertSuccess('');
    setAlertError('');

    try {
      const buttonLabels = flows.map((f) => f.buttonLabel).slice(0, 3);
      const res = await api.quickBroadcast({
        recipient_type: 'TEST',
        phone_number: testPhoneNumber.trim(),
        service_name: 'Interactive Button Reply Flow',
        header_text: user?.client_details?.name || 'Interactive Menu',
        message: welcomePrompt,
        buttons: buttonLabels,
      });

      if (res?.success) {
        setAlertSuccess(`Interactive Button message sent to +91 ${testPhoneNumber}!`);
      } else {
        setAlertError(res?.message || 'Failed to dispatch test button message.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error executing test.');
    } finally {
      setTestingPhone(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-50 text-[#075E54] border border-emerald-200">
              Interactive WhatsApp Flow
            </span>
            <span className="text-xs text-slate-400 font-medium">•</span>
            <span className="text-xs text-slate-600 font-semibold">{user?.client_details?.name || 'Client Service'}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1.5">
            Button Reply (Multi-Option Choice Tree)
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure multi-level interactive button replies. When a customer selects a service (e.g. Wedding), present sub-options (e.g. Morning, Afternoon, Night) automatically!
          </p>
        </div>

        {/* Test Input */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            placeholder="Test phone (e.g. 9363938143)"
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
          />
          <button
            type="button"
            onClick={handleLiveTest}
            disabled={testingPhone || !testPhoneNumber.trim()}
            className="px-3.5 py-2 rounded-xl bg-[#075E54] hover:bg-[#064E3B] text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-[#25D366]" />
            <span>{testingPhone ? 'Sending...' : 'Test on Phone'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{alertSuccess}</div>
        </div>
      )}

      {alertError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{alertError}</div>
        </div>
      )}

      {/* TWO COLUMN WORKSPACE: FLOW BUILDER (LEFT) + LIVE INTERACTIVE PHONE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Option Tree Editor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Welcome Prompt */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Level 1: Main Welcome Question
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Initial Prompt Message
              </label>
              <textarea
                rows={2}
                value={welcomePrompt}
                onChange={(e) => setWelcomePrompt(e.target.value)}
                className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
              />
            </div>
          </div>

          {/* Primary Buttons */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Primary Choice Buttons (Up to 3)
              </h2>
              <span className="text-xs text-slate-500">{flows.length}/3 Buttons</span>
            </div>

            {/* Add Button Input */}
            {flows.length < 3 && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newButtonLabel}
                  maxLength={25}
                  onChange={(e) => setNewButtonLabel(e.target.value)}
                  placeholder="e.g. Wedding Shoot, Store Order..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
                <button
                  type="button"
                  onClick={handleAddMainFlow}
                  className="px-4 py-2 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Add Button
                </button>
              </div>
            )}

            {/* Flows Tabs */}
            <div className="flex flex-wrap gap-2 pt-1">
              {flows.map((flow, idx) => (
                <div
                  key={flow.id}
                  onClick={() => setActiveFlowId(flow.id)}
                  className={`cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    activeFlow?.id === flow.id
                      ? 'border-[#075E54] bg-[#075E54] text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{idx + 1}. {flow.buttonLabel}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMainFlow(flow.id);
                    }}
                    className="hover:text-rose-300 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Level 2 Sub-options for the Selected Button */}
          {activeFlow && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold text-[#075E54] uppercase tracking-wider">Sub-Options Configuration</span>
                <h3 className="text-sm font-black text-slate-900 mt-0.5">
                  When customer clicks "{activeFlow.buttonLabel}"
                </h3>
              </div>

              {/* Follow-up question */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Follow-Up Question
                </label>
                <input
                  type="text"
                  value={activeFlow.followUpPrompt}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFlows(flows.map((f) => (f.id === activeFlow.id ? { ...f, followUpPrompt: val } : f)));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#075E54]"
                />
              </div>

              {/* Sub-options List */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sub-Option Buttons (e.g. Morning, Afternoon, Night)
                </label>

                <div className="space-y-2">
                  {activeFlow.subOptions.map((sub, sIdx) => (
                    <div key={sub.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Option {sIdx + 1}: [{sub.label}]
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubOption(sub.id)}
                          className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                        >
                          ✕ Delete
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                        <b>Bot Reply:</b> {sub.response}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Add Sub Option Inputs */}
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
                  <span className="text-xs font-bold text-slate-800">+ Add New Choice Button</span>
                  <input
                    type="text"
                    value={newSubLabel}
                    maxLength={25}
                    onChange={(e) => setNewSubLabel(e.target.value)}
                    placeholder="Button Label (e.g. Morning, Afternoon, Night)"
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white"
                  />
                  <input
                    type="text"
                    value={newSubResponse}
                    onChange={(e) => setNewSubResponse(e.target.value)}
                    placeholder="Bot Response when selected..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubOption}
                    disabled={!newSubLabel.trim()}
                    className="px-3.5 py-1.5 bg-[#075E54] hover:bg-[#064E3B] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    Add Choice
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Live Interactive Mobile Simulation */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-slate-900 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
            {/* Notch */}
            <div className="flex justify-center mb-3">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
              </div>
            </div>

            {/* Screen */}
            <div className="bg-[#EFEAE2] rounded-[28px] overflow-hidden border border-slate-700 flex flex-col h-[580px] shadow-inner">
              {/* Header */}
              <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-xs">
                <div>
                  <h4 className="text-xs font-bold leading-tight">{user?.client_details?.name || 'Interactive Flow'}</h4>
                  <p className="text-[10px] text-emerald-200">Live Button Reply Test</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSimStep(1);
                    setSelectedMainBtn(null);
                    setSelectedSubOpt(null);
                  }}
                  className="text-[10px] text-emerald-200 hover:text-white"
                >
                  Restart
                </button>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
                {/* Level 1: Welcome Prompt */}
                <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs max-w-[92%] border border-slate-200/60 space-y-1.5">
                  <p className="text-slate-800 leading-relaxed">{welcomePrompt}</p>
                  <span className="text-[9px] text-slate-400 block text-right">10:00 AM</span>
                </div>

                {/* Level 1 Buttons */}
                <div className="space-y-1.5 max-w-[92%]">
                  {flows.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedMainBtn(f);
                        setSelectedSubOpt(null);
                        setSimStep(2);
                      }}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                        selectedMainBtn?.id === f.id
                          ? 'bg-[#075E54] text-white border-[#075E54]'
                          : 'bg-white hover:bg-slate-50 text-[#075E54] border-slate-200 shadow-2xs'
                      }`}
                    >
                      <span>{f.buttonLabel}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  ))}
                </div>

                {/* Level 2: Sub-options if a button was clicked */}
                {selectedMainBtn && (
                  <div className="pt-2 space-y-3 animate-fade-in">
                    {/* User Selection Bubble */}
                    <div className="flex justify-end">
                      <div className="bg-[#E7FFDB] text-slate-900 rounded-2xl rounded-tr-xs px-3.5 py-1.5 text-xs shadow-2xs">
                        {selectedMainBtn.buttonLabel} ✓✓
                      </div>
                    </div>

                    {/* Follow-up question */}
                    <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs max-w-[92%] border border-slate-200/60 space-y-1.5">
                      <p className="text-slate-800 leading-relaxed">{selectedMainBtn.followUpPrompt}</p>
                      <span className="text-[9px] text-slate-400 block text-right">10:01 AM</span>
                    </div>

                    {/* Sub-option buttons */}
                    <div className="space-y-1.5 max-w-[92%]">
                      {selectedMainBtn.subOptions.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSelectedSubOpt(sub);
                            setSimStep(3);
                          }}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                            selectedSubOpt?.id === sub.id
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white hover:bg-slate-50 text-emerald-800 border-slate-200 shadow-2xs'
                          }`}
                        >
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Level 3: Final confirmation */}
                {selectedSubOpt && (
                  <div className="pt-2 space-y-2 animate-fade-in">
                    <div className="flex justify-end">
                      <div className="bg-[#E7FFDB] text-slate-900 rounded-2xl rounded-tr-xs px-3.5 py-1.5 text-xs shadow-2xs">
                        {selectedSubOpt.label} ✓✓
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl rounded-tl-xs p-3 shadow-xs max-w-[92%] border border-slate-200/60 space-y-1">
                      <p className="text-slate-800 leading-relaxed font-semibold">{selectedSubOpt.response}</p>
                      <span className="text-[9px] text-slate-400 block text-right">10:02 AM</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
