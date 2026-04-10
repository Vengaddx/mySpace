'use client';

import React, { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { useTheme } from '@/components/layout/ThemeProvider';
import { cn } from '@/lib/utils';
import { User, Bell, Globe, CalendarDays, Mail, Smartphone, Check, Sun, Moon } from 'lucide-react';

export default function SettingsPage() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weekStart, setWeekStart] = useState<'sunday' | 'monday'>('monday');
  const [timezone, setTimezone] = useState('Asia/Riyadh');
  const [defaultWorkstream, setDefaultWorkstream] = useState('aramco');
  const [saved, setSaved] = useState(false);
  const { theme, toggle } = useTheme();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectCls = "w-full text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors";

  return (
    <PageContainer>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Settings</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Personal workspace configuration</p>
        </div>

        {/* Profile */}
        <div className="mb-8">
          <SectionHeader title="Profile" />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">D</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Deeshv</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Personal Workspace · Single User</p>
              </div>
              <button className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
                Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-zinc-50 dark:border-zinc-800">
              <SettingsInput label="Display Name" defaultValue="Deeshv" />
              <SettingsInput label="Email" defaultValue="deeshv@example.com" type="email" />
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="mb-8">
          <SectionHeader title="Appearance" />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  {theme === 'dark'
                    ? <Moon className="w-4 h-4 text-zinc-400 dark:text-zinc-300" />
                    : <Sun className="w-4 h-4 text-zinc-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Premium minimal black & white design</p>
                </div>
              </div>
              <button
                onClick={toggle}
                className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-2 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <SectionHeader title="Notifications" />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <ToggleRow icon={<Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />} label="Email Reminders" description="Receive task reminders via email" value={emailReminders} onChange={setEmailReminders} />
            <div className="h-px bg-zinc-50 dark:bg-zinc-800" />
            <ToggleRow icon={<Bell className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />} label="Push Notifications" description="Browser push notifications for due tasks" value={pushNotifications} onChange={setPushNotifications} />
            <div className="h-px bg-zinc-50 dark:bg-zinc-800" />
            <ToggleRow icon={<Smartphone className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />} label="Mobile / PWA" description="Install as a PWA for mobile quick access" value={false} onChange={() => {}} disabled badge="Coming soon" />
          </div>
        </div>

        {/* Preferences */}
        <div className="mb-8">
          <SectionHeader title="Preferences" />
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Week Starts On</p>
                </div>
                <div className="flex gap-2">
                  {(['monday', 'sunday'] as const).map((day) => (
                    <button
                      key={day}
                      onClick={() => setWeekStart(day)}
                      className={cn(
                        'flex-1 py-2 rounded-xl text-xs font-medium border transition-all',
                        weekStart === day
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                          : 'text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500'
                      )}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Default Workstream</p>
                </div>
                <select value={defaultWorkstream} onChange={(e) => setDefaultWorkstream(e.target.value)} className={selectCls}>
                  <option value="aramco">Aramco</option>
                  <option value="satorp">SATORP</option>
                  <option value="pmo">PMO</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Timezone</p>
              </div>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={selectCls}>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
              saved
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-100'
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved</> : 'Save Changes'}
          </button>
        </div>
      </PageContainer>
  );
}

function SettingsInput({ label, defaultValue, type = 'text' }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2.5 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors"
      />
    </div>
  );
}

function ToggleRow({ icon, label, description, value, onChange, disabled, badge }: {
  icon: React.ReactNode; label: string; description: string; value: boolean;
  onChange: (v: boolean) => void; disabled?: boolean; badge?: string;
}) {
  return (
    <div className={cn('flex items-center gap-4 px-5 py-4', disabled && 'opacity-50')}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{label}</p>
          {badge && <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        className={cn('w-10 h-6 rounded-full transition-all duration-200 relative shrink-0', value && !disabled ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700')}
        disabled={disabled}
      >
        <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 shadow transition-all duration-200', value && !disabled ? 'left-5' : 'left-1')} />
      </button>
    </div>
  );
}
