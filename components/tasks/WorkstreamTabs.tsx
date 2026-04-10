'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DEFAULT_WORKSTREAM_TABS = ['All', 'Aramco', 'SATORP', 'PMO', 'Personal'];
const MAX_CUSTOM_TABS = 5; // 5 default + 5 custom = 10 max

interface WorkstreamTabsProps {
  selected: string;
  onSelect: (tab: string) => void;
  customTabs: string[];
  onAddTab: (name: string) => void;
  onRemoveTab: (name: string) => void;
}

export function WorkstreamTabs({
  selected,
  onSelect,
  customTabs,
  onAddTab,
  onRemoveTab,
}: WorkstreamTabsProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const allTabs = [...DEFAULT_WORKSTREAM_TABS, ...customTabs];
  const canAddMore = customTabs.length < MAX_CUSTOM_TABS;

  useEffect(() => {
    if (showPopover) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setNewTabName('');
      setError('');
    }
  }, [showPopover]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPopover]);

  const handleAdd = () => {
    const name = newTabName.trim();
    if (!name) return;
    if (allTabs.map((t) => t.toLowerCase()).includes(name.toLowerCase())) {
      setError('This workstream already exists.');
      return;
    }
    onAddTab(name);
    setShowPopover(false);
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Pill container — scrollable on mobile */}
      <div className="overflow-x-auto no-scrollbar flex-1 min-w-0">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-full p-[3px] gap-[2px] w-fit">
          {allTabs.map((tab) => {
            const isCustom = customTabs.includes(tab);
            const isActive = selected === tab;
            return (
              <div key={tab} className="relative group/tab flex-shrink-0">
                <button
                  onClick={() => onSelect(tab)}
                  className={cn(
                    'relative px-3.5 py-[5px] text-[12px] font-medium rounded-full transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50'
                  )}
                >
                  {tab}
                </button>
                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selected === tab) onSelect('All');
                      onRemoveTab(tab);
                    }}
                    className="hidden group-hover/tab:flex absolute -top-[3px] -right-[3px] w-[14px] h-[14px] bg-zinc-400 dark:bg-zinc-600 hover:bg-zinc-600 dark:hover:bg-zinc-400 rounded-full items-center justify-center transition-colors z-10"
                    aria-label={`Remove ${tab}`}
                  >
                    <X size={7} className="text-white" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add button */}
      {canAddMore && (
        <div className="relative shrink-0" ref={popoverRef}>
          <button
            onClick={() => setShowPopover(!showPopover)}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full border transition-all',
              showPopover
                ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                : 'border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
            )}
            aria-label="Add workstream"
          >
            <Plus size={13} />
          </button>

          {showPopover && (
            <div className="absolute top-9 left-0 z-50 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-black/50 p-4 w-56">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
                New Workstream
              </p>
              <input
                ref={inputRef}
                value={newTabName}
                onChange={(e) => { setNewTabName(e.target.value); setError(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') setShowPopover(false);
                }}
                placeholder="e.g. Finance, Legal..."
                maxLength={20}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-colors"
              />
              {error && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">{error}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAdd}
                  disabled={!newTabName.trim()}
                  className="flex-1 py-1.5 text-xs font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowPopover(false)}
                  className="flex-1 py-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
              </div>
              {customTabs.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                    Custom ({customTabs.length}/{MAX_CUSTOM_TABS})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {customTabs.map((tab) => (
                      <div
                        key={tab}
                        className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-md px-2 py-0.5"
                      >
                        <span className="text-[11px] text-zinc-600 dark:text-zinc-300">{tab}</span>
                        <button
                          onClick={() => {
                            if (selected === tab) onSelect('All');
                            onRemoveTab(tab);
                          }}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
