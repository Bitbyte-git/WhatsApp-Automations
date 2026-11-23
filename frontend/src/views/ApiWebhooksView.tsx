import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Code,
  ExternalLink,
  Terminal,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';
import { WebhookEvent } from '../types';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';

export const ApiWebhooksView: React.FC = () => {
  const [webhookLogs, setWebhookLogs] = useState<WebhookEvent[]>([]);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, statusRes] = await Promise.all([
        api.getWebhookLogs(),
        api.getMetaStatus(),
      ]);
      setWebhookLogs(logsRes.results || logsRes || []);
      setMetaStatus(statusRes);
    } catch {
      setWebhookLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const callbackUrl = metaStatus?.webhook_callback_url || `${window.location.origin}/api/webhooks/whatsapp/`;
  const verifyToken = 'bitbyte_whatsapp_webhook_token_secure';

  const handleCopy = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">API & Webhooks Configuration</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Meta Cloud API webhook endpoints, event deduplication logs, and developer integration specs.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-subtle transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
          Refresh Webhook Logs
        </button>
      </div>

      {/* Meta Webhook Endpoint Credentials Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Webhook className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Meta WhatsApp Webhook Configuration
            </h3>
          </div>
          <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            HMAC-SHA256 Signature Guard Active
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Configure these parameters inside your <strong className="text-gray-800">Meta Developer Portal</strong> under
          WhatsApp &gt; Configuration &gt; Callback URL. All incoming events (messages, statuses, template approvals)
          are cryptographically validated and deduplicated.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          {/* Callback URL */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Webhook Callback URL</span>
              <button
                onClick={() => handleCopy(callbackUrl, true)}
                className="text-emerald-700 hover:text-emerald-800 flex items-center font-medium"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedUrl ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-gray-800 break-all select-all">{callbackUrl}</p>
          </div>

          {/* Verify Token */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-700 uppercase tracking-wider text-[11px]">Verify Token</span>
              <button
                onClick={() => handleCopy(verifyToken, false)}
                className="text-emerald-700 hover:text-emerald-800 flex items-center font-medium"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copiedToken ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="font-mono text-gray-800 select-all">{verifyToken}</p>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Webhook Web Subscriptions: <strong className="font-mono">messages</strong>, <strong className="font-mono">message_template_status_update</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700">Meta v21.0 Ready</span>
        </div>
      </div>

      {/* Real-time Webhook Event Logs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Recent Inbound Webhook Events
            </h3>
            <p className="text-xs text-gray-500">Live payloads received from Meta Cloud API</p>
          </div>
          <span className="text-xs text-gray-400">Total Events: {webhookLogs.length}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p>Loading webhook audit logs...</p>
          </div>
        ) : webhookLogs.length === 0 ? (
          <EmptyState
            title="No webhook events logged yet."
            description="When Meta Cloud API posts incoming message updates, status changes, or template reviews, they will be logged here in real-time."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="py-3 px-4">Event ID / Hash</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Processing Status</th>
                  <th className="py-3 px-4">Received Timestamp</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {webhookLogs.map((evt) => (
                  <tr key={evt.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                      {evt.event_id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px]">
                        {evt.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={evt.status} />
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(evt.received_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors inline-flex items-center"
                      >
                        <Code className="w-3 h-3 mr-1" />
                        Inspect JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Payload Inspector Modal */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={`Webhook Payload: ${selectedEvent?.event_type || 'Event'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Event ID: <strong className="font-mono text-gray-800">{selectedEvent?.event_id}</strong></span>
            <span>{selectedEvent && new Date(selectedEvent.received_at).toLocaleString()}</span>
          </div>
          <pre className="p-4 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96">
            {JSON.stringify(selectedEvent?.payload, null, 2)}
          </pre>
          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
