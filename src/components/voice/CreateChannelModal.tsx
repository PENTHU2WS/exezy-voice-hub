import { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';
import { Button } from '../common/Button';
// import { db } from '../../lib/config';
// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';

interface CreateChannelModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export function CreateChannelModal({ onClose, onCreated }: CreateChannelModalProps) {
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!channelName.trim()) return;

        setCreating(true);
        try {
            // Mock Create
            console.log('Mock create channel:', {
                name: channelName.trim(),
                type: channelType,
                category: channelType === 'text' ? 'METİN KANALLARI' : 'SES KANALLARI',
                created_at: new Date().toISOString()
            });

            setTimeout(() => {
                onCreated();
                setCreating(false);
            }, 500);
        } catch (error) {
            console.error('Create channel error:', error);
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="modal-content bg-[#313338] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Kanal Oluştur</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Channel Type */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
                            Kanal Tipi
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setChannelType('text')}
                                className={cn(
                                    "p-4 rounded-lg border-2 transition-all text-left",
                                    channelType === 'text'
                                        ? "border-purple-500 bg-purple-500/10"
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                )}
                            >
                                <Hash className={cn(
                                    "w-6 h-6 mb-2",
                                    channelType === 'text' ? "text-purple-500" : "text-gray-400"
                                )} />
                                <p className="text-sm font-bold text-white">Metin</p>
                                <p className="text-xs text-gray-500">Mesajlaşma kanalı</p>
                            </button>

                            <button
                                onClick={() => setChannelType('voice')}
                                className={cn(
                                    "p-4 rounded-lg border-2 transition-all text-left",
                                    channelType === 'voice'
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                )}
                            >
                                <Volume2 className={cn(
                                    "w-6 h-6 mb-2",
                                    channelType === 'voice' ? "text-green-500" : "text-gray-400"
                                )} />
                                <p className="text-sm font-bold text-white">Ses</p>
                                <p className="text-xs text-gray-500">Sesli sohbet kanalı</p>
                            </button>
                        </div>
                    </div>

                    {/* Channel Name */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">
                            Kanal Adı
                        </label>
                        <input
                            type="text"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder={channelType === 'text' ? 'general' : 'lounge'}
                            className="w-full bg-[#1e1f22] text-white px-4 py-3 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none transition-colors"
                            maxLength={30}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {channelName.length}/30 karakter
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#2b2d31] flex items-center justify-end gap-3">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-white/10 hover:border-white/20 text-gray-300"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!channelName.trim() || creating}
                        className={cn(
                            "bg-gradient-to-r font-bold",
                            channelType === 'text'
                                ? "from-purple-600 to-purple-500"
                                : "from-green-600 to-green-500"
                        )}
                    >
                        {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
