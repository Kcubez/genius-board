'use client';

import { useState, useEffect } from 'react';
import { Settings, Key, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [geminiKey, setGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/auth/settings');
        const data = await res.json();
        if (data.success && data.geminiKey) {
          setGeminiKey(data.geminiKey);
        }
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/auth/update-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: geminiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Gemini API Key saved successfully');
      } else {
        toast.error(data.error || 'Failed to save API key');
      }
    } catch {
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="dash-card px-4 sm:px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <Settings className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Settings</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account settings</p>
          </div>
        </div>
      </div>

      {/* API Key Settings */}
      <div className="dash-card p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Gemini API Key</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Enter your Gemini API key to enable AI-powered insights and recommendations.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="gemini-key" className="text-xs text-slate-600 dark:text-slate-400">
              API Key
            </Label>
            <div className="relative mt-1.5">
              <Input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="pr-10 rounded-lg border-slate-200 dark:border-slate-700 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            onClick={handleSaveGeminiKey}
            disabled={isSaving || !geminiKey.trim() || isLoading}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
