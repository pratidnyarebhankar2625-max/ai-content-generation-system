import { useState } from "react";
import { X, Sparkles, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATARS = [
  "/avatars/1.png",
  "/avatars/2.png",
  "/avatars/3.png",
  "/avatars/4.png",
];

export function AvatarSelectionModal({ isOpen, onClose }: AvatarSelectionModalProps) {
  const { user, updateUser } = useAuth();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatar || "");
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSave() {
    setIsSaving(true);
    setSuccess(false);
    
    // Simulate network delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 600));
    
    await updateUser({
      name: displayName,
      avatar: selectedAvatar,
    });
    
    setIsSaving(false);
    setSuccess(true);
    
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-[#113680] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
              <Sparkles className="h-5 w-5 text-[#fe4443]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold">Edit Profile</h3>
              <p className="text-xs text-white/70">Customize your avatar and name</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#113680]">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
              placeholder="Your name"
            />
          </div>
          
          {/* Avatar Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#113680]">Choose an Avatar</label>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((avatar, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                    selectedAvatar === avatar 
                      ? "border-[#fe4443] shadow-[0_0_15px_rgba(254,68,67,0.3)] scale-105" 
                      : "border-transparent bg-slate-50 hover:border-[#113680]/30 hover:scale-105"
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${idx + 1}`} className="h-full w-full object-cover" />
                  
                  {selectedAvatar === avatar && (
                    <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#fe4443] shadow-sm">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-slate-50 p-5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || success}
            className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#113680] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all hover:bg-[#0a2050] disabled:opacity-80"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : success ? (
              <>
                <Check className="h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
