import type { AITool } from '@/types';

const providerIcons: Record<string, string> = {
    openai: '🤖',
    anthropic: '🔮',
    google: '✨',
};

const providerColors: Record<string, string> = {
    openai: 'from-emerald-900/30 to-emerald-800/10 border-emerald-700/30',
    anthropic: 'from-orange-900/30 to-orange-800/10 border-orange-700/30',
    google: 'from-blue-900/30 to-blue-800/10 border-blue-700/30',
};

interface ToolCardProps {
    tool: AITool;
}

export default function ToolCard({ tool }: ToolCardProps) {
    return (
        <div
            className={`
        bg-gradient-to-br ${providerColors[tool.name] ?? 'from-slate-900 to-slate-900 border-slate-700'}
        border rounded-2xl p-6 relative overflow-hidden
      `}
        >
            <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{providerIcons[tool.name] ?? '🔧'}</span>
                <span
                    className={`
            text-xs font-medium px-2.5 py-1 rounded-full
            ${tool.is_active
                            ? 'bg-green-900/40 text-green-400 border border-green-700/30'
                            : 'bg-slate-700 text-slate-400'}
          `}
                >
                    {tool.is_active ? 'Aktif' : 'Pasif'}
                </span>
            </div>

            <h3 className="text-white font-semibold text-lg mb-1">{tool.display_name}</h3>
            <p className="text-slate-400 text-sm mb-2">{tool.model}</p>
            <p className="text-slate-600 text-xs">
                Eklendi: {new Date(tool.created_at).toLocaleDateString('tr-TR')}
            </p>

            {/* Decorative background */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/[0.02]" />
        </div>
    );
}
