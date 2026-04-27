import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, ExternalLink, Pin, MessageCircle, Inbox, Archive, Edit3, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FamilyNote } from '../types/note';

interface NoteCardProps {
  note: FamilyNote;
  onEdit: (n: FamilyNote) => void;
  onDelete: (n: FamilyNote) => void;
  onPin: () => void;
  onArchive: () => void;
  onWhatsApp: (n: FamilyNote) => void;
  onUpdate: (id: string, updates: Partial<FamilyNote>) => Promise<void>;
}

export function NoteCard({ note, onEdit, onDelete, onPin, onArchive, onWhatsApp, onUpdate }: NoteCardProps) {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  const toggleCheckbox = async (idx: number) => {
    const lines = note.content.split('\n');
    const line = lines[idx];

    let newLine = line;
    const trimmed = line.trim();
    if (trimmed.startsWith('>x')) {
      newLine = line.replace(/>x\s?/, '> ');
    } else if (trimmed.startsWith('>')) {
      newLine = line.replace(/>\s?/, '>x ');
    }

    if (newLine !== line) {
      lines[idx] = newLine;
      await onUpdate(note.id, { content: lines.join('\n') });
    }
  };

  const renderContent = () => {
    const lines = note.content.split('\n');
    return (
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          const isCheckbox = trimmed.startsWith('>') && !trimmed.startsWith('>>');

          if (isCheckbox) {
            const isChecked = trimmed.startsWith('>x');
            const text = trimmed.replace(/^>x?\s?/, '').trim();
            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCheckbox(idx);
                }}
                className={`flex items-start gap-3 p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${isChecked ? 'bg-black/5 opacity-60' : 'bg-white/40 hover:bg-white/60 shadow-sm border border-black/5'
                  }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-sage-900 border-sage-900 text-white' : 'bg-white border-sage-200'
                  }`}>
                  {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </div>
                <span className={`text-sm leading-tight transition-all ${isChecked ? 'text-sage-400 line-through' : 'text-sage-800 font-medium'}`}>
                  {text}
                </span>
              </div>
            );
          }

          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
          if (isBullet) {
            const text = line.trim().substring(2).trim();
            return (
              <div key={idx} className="flex items-start gap-3 px-1">
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-sage-400 shrink-0" />
                <span className="text-sm text-sage-700 font-medium leading-relaxed">{text}</span>
              </div>
            );
          }

          const isUrl = /^(https?:\/\/[^\s]+)$/.test(trimmed);
          if (isUrl) {
            return (
              <a
                key={idx}
                href={trimmed}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-gradient-to-r from-white/80 to-white/40 border border-black/5 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-blue-200/50 transition-all group/link mt-1"
              >
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-blue-500 border border-black/[0.03] group-hover/link:scale-110 group-hover/link:rotate-6 transition-all duration-300">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black text-sage-900 truncate group-hover/link:text-blue-600 transition-colors">
                    {trimmed.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-sage-400 truncate opacity-70">
                    {trimmed.replace(/^https?:\/\/([^\/]+)/, '') || '/'}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-all scale-75 group-hover/link:scale-100">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                </div>
              </a>
            );
          }

          const colonIndex = line.indexOf(':');
          if (colonIndex !== -1) {
            const label = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            const isPassword = /pass|pwd|sandi|pin/i.test(label);
            const isValueUrl = /^(https?:\/\/[^\s]+)$/.test(value);
            const isVisible = showPasswords[idx];

            return (
              <div key={idx} className="group/field flex flex-col gap-1 bg-white/60 p-3 rounded-2xl border border-black/5 hover:border-black/10 transition-all shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-sage-400 uppercase tracking-widest">{label}</span>
                  <div className="flex items-center gap-2">
                    {isPassword && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPasswords(prev => ({ ...prev, [idx]: !prev[idx] }));
                        }}
                        className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter"
                      >
                        {isVisible ? 'Sembunyi' : 'Lihat'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm font-bold text-sage-900 break-words pr-2">
                  {isPassword && !isVisible ? (
                    <span className="tracking-[0.3em] font-black text-sage-200">••••••••</span>
                  ) : isValueUrl ? (
                    <a
                      href={value}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {value.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    value
                  )}
                </div>
              </div>
            );
          }

          if (line.trim() === '') return <div key={idx} className="h-1" />;

          return (
            <p key={idx} className="text-sage-600 text-sm leading-relaxed break-words font-medium px-1">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      layout
      style={{ backgroundColor: note.color || '#ffffff' }}
      className={`group rounded-[2rem] p-5 md:p-6 border transition-all duration-300 relative flex flex-col gap-4 ${note.color && note.color !== '#ffffff'
          ? 'border-black/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
          : 'border-sage-100 shadow-sm'
        } hover:shadow-xl hover:shadow-sage-900/5 hover:-translate-y-1 overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="space-y-4 flex-1">
          {note.title && (
            <h3 className="font-display font-bold text-sage-900 text-base md:text-xl leading-tight line-clamp-2 pr-6">
              {note.title}
            </h3>
          )}

          {note.imageUrls && note.imageUrls.length > 0 ? (
            <div className={`grid gap-2 ${note.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {note.imageUrls.map((url, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-black/5 shadow-sm aspect-[4/3]">
                  <img src={url} alt={`Lampiran ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : note.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-black/5 shadow-sm aspect-video">
              <img src={note.imageUrl} alt="Lampiran" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="relative">
            {renderContent()}
          </div>
        </div>

        <button
          onClick={onPin}
          className={`absolute top-0 right-0 p-2.5 rounded-xl transition-all ${note.isPinned
              ? 'text-rose-500 bg-rose-50 shadow-sm'
              : 'text-sage-300 hover:bg-black/5 opacity-0 group-hover:opacity-100'
            }`}
        >
          <Pin className={`w-4 h-4 ${note.isPinned ? 'fill-current' : 'rotate-45'}`} />
        </button>
      </div>

      <div className="flex flex-col gap-4 pt-4 mt-auto border-t border-black/5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sage-900 flex items-center justify-center text-[10px] font-bold text-white shadow-inner">
              {note.authorName?.substring(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-sage-900 uppercase tracking-tighter">
                {note.authorName}
              </span>
              <span className="text-[8px] font-bold text-sage-400 uppercase tracking-[0.1em]">
                {format(note.createdAt as Date, 'd MMM yyyy', { locale: id })}
              </span>
            </div>
          </div>

          <div className="flex items-center bg-white/40 p-1 rounded-xl border border-black/5 shadow-sm">
            <button
              onClick={() => onWhatsApp(note)}
              className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Kirim ke WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
            <button
              onClick={onArchive}
              className="w-8 h-8 flex items-center justify-center text-sage-400 hover:bg-sage-50 rounded-lg transition-colors"
            >
              {note.isArchived ? <Inbox className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(note)}
              className="w-8 h-8 flex items-center justify-center text-sage-400 hover:bg-sage-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(note)}
              className="w-8 h-8 flex items-center justify-center text-sage-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
