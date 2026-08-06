import { useEffect, useState } from "react";
import { FaLock, FaShieldAlt, FaKey, FaCheckCircle } from "react-icons/fa";
import { computeFingerprint } from "../../utils/crypto";

const SecurityModal = ({ isOpen, onClose, conversation }) => {
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    if (conversation) {
      computeFingerprint(conversation._id + (conversation.groupName || conversation.fullName)).then(
        (fp) => setFingerprint(fp)
      );
    }
  }, [conversation]);

  if (!isOpen || !conversation) return null;

  const isGroup = conversation.isGroup;
  const title = isGroup ? conversation.groupName : conversation.fullName;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
            <FaShieldAlt className="text-xl" />
            <span>End-to-End Encryption Verification</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xl">
              <FaLock />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                <FaCheckCircle className="text-[11px]" />
                {isGroup ? "AES-GCM 256 Group Key Encrypted" : "AES-GCM 256 Direct Encrypted"}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <FaKey className="text-sky-400" /> Security Fingerprint Hash
            </label>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-center text-sky-400 text-sm tracking-wider select-all">
              {fingerprint || "CALCULATING..."}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
              Messages and calls are end-to-end encrypted. No one outside of this chat, not even TalkFusion servers, can read or listen to them.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-emerald-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityModal;
