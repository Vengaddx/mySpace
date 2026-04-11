'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Project, Task, Workstream } from '@/types';
import { cn } from '@/lib/utils';
import { Plus, FolderOpen, X, Check, Pencil, Trash2 } from 'lucide-react';

interface ProjectSideNavProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  workstream: Workstream;
  onSelect: (id: string | null) => void;
  onAddProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
}

export function ProjectSideNav({
  projects,
  tasks,
  selectedProjectId,
  onSelect,
  onAddProject,
  onRenameProject,
  onDeleteProject,
}: ProjectSideNavProps) {
  const [addingProject, setAddingProject] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingProject) inputRef.current?.focus();
  }, [addingProject]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const openCount = (projectId: string | null) => {
    if (projectId === null) return tasks.filter((t) => t.status !== 'done').length;
    return tasks.filter((t) => t.projectId === projectId && t.status !== 'done').length;
  };

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onAddProject(name);
    setNewName('');
    setAddingProject(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setAddingProject(false); setNewName(''); }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditName(project.name);
  };

  const commitEdit = () => {
    const name = editName.trim();
    if (name && editingId) onRenameProject(editingId, name);
    setEditingId(null);
    setEditName('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
  };

  const allOpen = openCount(null);

  return (
    <nav className="flex flex-col h-full">
      {/* All projects item */}
      <NavItem
        label="All projects"
        count={allOpen}
        selected={selectedProjectId === null}
        onClick={() => onSelect(null)}
        isAll
      />

      {/* Divider */}
      <div className="h-px bg-zinc-100 dark:bg-zinc-800/60 my-2" />

      {/* Project list */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
        {projects.map((project) => {
          const count = openCount(project.id);
          const isSelected = selectedProjectId === project.id;
          const isEditing = editingId === project.id;

          if (isEditing) {
            return (
              <div key={project.id} className="flex items-center gap-1 px-2 py-1">
                <input
                  ref={editInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={commitEdit}
                  className="flex-1 min-w-0 text-xs text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); commitEdit(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shrink-0"
                >
                  <Check size={11} />
                </button>
              </div>
            );
          }

          return (
            <NavItem
              key={project.id}
              label={project.name}
              count={count}
              selected={isSelected}
              onClick={() => onSelect(project.id)}
              onEdit={() => startEdit(project)}
              onDelete={() => {
                if (isSelected) onSelect(null);
                onDeleteProject(project.id);
              }}
            />
          );
        })}
      </div>

      {/* Add project */}
      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
        {addingProject ? (
          <div className="flex items-center gap-1.5 px-2">
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Project name..."
              className="flex-1 min-w-0 text-xs text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 disabled:opacity-30 transition-opacity"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => { setAddingProject(false); setNewName(''); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingProject(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
          >
            <Plus size={13} className="transition-colors" />
            Add project
          </button>
        )}
      </div>
    </nav>
  );
}

function NavItem({
  label,
  count,
  selected,
  onClick,
  isAll = false,
  onEdit,
  onDelete,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
  isAll?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all duration-150',
          selected
            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FolderOpen
            size={13}
            className={cn(
              'shrink-0',
              selected
                ? 'text-white/70 dark:text-zinc-700'
                : 'text-zinc-300 dark:text-zinc-600'
            )}
          />
          <span
            className={cn(
              'truncate leading-none',
              isAll ? 'text-[12px] font-semibold' : 'text-[12px] font-medium'
            )}
          >
            {label}
          </span>
        </div>
        {/* Show count only when not hovered or no actions */}
        {count > 0 && (!hovered || isAll) && (
          <span
            className={cn(
              'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums leading-none',
              selected
                ? 'bg-white/20 dark:bg-zinc-900/30 text-white dark:text-zinc-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            )}
          >
            {count}
          </span>
        )}
      </button>

      {/* Edit / Delete actions — shown on hover for non-"All" items */}
      {!isAll && hovered && onEdit && onDelete && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-md transition-colors',
              selected
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            )}
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={cn(
              'w-6 h-6 flex items-center justify-center rounded-md transition-colors',
              selected
                ? 'text-white/70 hover:text-red-300 hover:bg-white/10'
                : 'text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            )}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
