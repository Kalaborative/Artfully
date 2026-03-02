import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useShopStore } from '../store/shopStore';
import Card from '../components/ui/Card';
import { Settings, Palette, Check, Frame, Flame } from 'lucide-react';
import DisplayName from '../components/ui/DisplayName';
import type { AvatarFrame } from '../components/ui/Avatar';

export default function SettingsPage() {
  const { profile, updateProfile, refreshProfile } = useAuthStore();
  const { activeTheme, setTheme } = useThemeStore();
  const { purchasedItems } = useShopStore();
  const activeFrame = (profile?.activeFrame || null) as AvatarFrame;
  const activeNameEffect = profile?.activeNameEffect || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Settings
      </h1>

      {/* Theme Section */}
      <div className="mb-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary-500" />
            Themes
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Default Theme */}
            <button
              onClick={async () => {
                setTheme(null);
                await updateProfile({ activeTheme: '' });
              }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                !activeTheme
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {!activeTheme && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="flex gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#14b8a6]" />
                <div className="w-6 h-6 rounded-full bg-[#06b6d4]" />
                <div className="w-6 h-6 rounded-full bg-[#d946ef]" />
              </div>
              <p className="font-semibold">Default</p>
              <p className="text-sm text-gray-500">Teal & Cyan</p>
            </button>

            {/* Ocean Theme */}
            {purchasedItems.includes('ocean-theme') ? (
              <button
                onClick={async () => {
                  const next = activeTheme === 'ocean' ? null : 'ocean';
                  setTheme(next);
                  await updateProfile({ activeTheme: next || '' });
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  activeTheme === 'ocean'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {activeTheme === 'ocean' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#3b82f6]" />
                  <div className="w-6 h-6 rounded-full bg-[#06b6d4]" />
                  <div className="w-6 h-6 rounded-full bg-[#22c55e]" />
                </div>
                <p className="font-semibold">🌊 Ocean</p>
                <p className="text-sm text-gray-500">Deep Blue & Cyan</p>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-60">
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                </div>
                <p className="font-semibold">🌊 Ocean</p>
                <p className="text-sm text-gray-400">Purchase in Shop to unlock</p>
              </div>
            )}

            {/* Sunset Theme */}
            {purchasedItems.includes('sunset-theme') ? (
              <button
                onClick={async () => {
                  const next = activeTheme === 'sunset' ? null : 'sunset';
                  setTheme(next);
                  await updateProfile({ activeTheme: next || '' });
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  activeTheme === 'sunset'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {activeTheme === 'sunset' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#f97316]" />
                  <div className="w-6 h-6 rounded-full bg-[#f43f5e]" />
                  <div className="w-6 h-6 rounded-full bg-[#e11d48]" />
                </div>
                <p className="font-semibold">🌅 Sunset</p>
                <p className="text-sm text-gray-500">Warm Orange & Coral</p>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-60">
                <div className="flex gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                </div>
                <p className="font-semibold">🌅 Sunset</p>
                <p className="text-sm text-gray-400">Purchase in Shop to unlock</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Frames Section */}
      <div className="mb-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Frame className="w-5 h-5 text-yellow-500" />
            Avatar Frames
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* No Frame */}
            <button
              onClick={async () => {
                await updateProfile({ activeFrame: '' });
                await refreshProfile();
              }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                !activeFrame
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {!activeFrame && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2" />
              <p className="font-semibold text-center">None</p>
              <p className="text-sm text-gray-500 text-center">Default look</p>
            </button>

            {/* Gold Frame */}
            {purchasedItems.includes('gold-frame') ? (
              <button
                onClick={async () => {
                  const next = activeFrame === 'gold-frame' ? '' : 'gold-frame';
                  await updateProfile({ activeFrame: next });
                  await refreshProfile();
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  activeFrame === 'gold-frame'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {activeFrame === 'gold-frame' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 p-[3px] mx-auto mb-2">
                  <div className="w-full h-full rounded-full bg-gray-200" />
                </div>
                <p className="font-semibold text-center">🖼️ Gold Frame</p>
                <p className="text-sm text-gray-500 text-center">Prestigious gold border</p>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-60">
                <div className="w-14 h-14 rounded-full bg-gray-300 p-[3px] mx-auto mb-2">
                  <div className="w-full h-full rounded-full bg-gray-200" />
                </div>
                <p className="font-semibold text-center">🖼️ Gold Frame</p>
                <p className="text-sm text-gray-400 text-center">Purchase in Shop to unlock</p>
              </div>
            )}

            {/* Rainbow Frame */}
            {purchasedItems.includes('rainbow-frame') ? (
              <button
                onClick={async () => {
                  const next = activeFrame === 'rainbow-frame' ? '' : 'rainbow-frame';
                  await updateProfile({ activeFrame: next });
                  await refreshProfile();
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  activeFrame === 'rainbow-frame'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {activeFrame === 'rainbow-frame' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 p-[3px] mx-auto mb-2">
                  <div className="w-full h-full rounded-full bg-gray-200" />
                </div>
                <p className="font-semibold text-center">🌈 Rainbow Frame</p>
                <p className="text-sm text-gray-500 text-center">Colorful rainbow border</p>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-60">
                <div className="w-14 h-14 rounded-full bg-gray-300 p-[3px] mx-auto mb-2">
                  <div className="w-full h-full rounded-full bg-gray-200" />
                </div>
                <p className="font-semibold text-center">🌈 Rainbow Frame</p>
                <p className="text-sm text-gray-400 text-center">Purchase in Shop to unlock</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Name Effects Section */}
      <div className="mb-6">
        <Card>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Name Effects
          </h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* No Effect */}
            <button
              onClick={async () => {
                await updateProfile({ activeNameEffect: '' });
                await refreshProfile();
              }}
              className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                !activeNameEffect
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {!activeNameEffect && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <p className="font-semibold text-center mb-1">None</p>
              <p className="text-sm text-gray-500 text-center">Default name style</p>
            </button>

            {/* Fire Name */}
            {purchasedItems.includes('fire-name') ? (
              <button
                onClick={async () => {
                  const next = activeNameEffect === 'fire-name' ? '' : 'fire-name';
                  await updateProfile({ activeNameEffect: next });
                  await refreshProfile();
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  activeNameEffect === 'fire-name'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {activeNameEffect === 'fire-name' && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <p className="font-semibold text-center mb-1">
                  <DisplayName name="🔥 Fire Name" effect="fire-name" />
                </p>
                <p className="text-sm text-gray-500 text-center">Fiery display name</p>
              </button>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 opacity-60">
                <p className="font-semibold text-center mb-1">🔥 Fire Name</p>
                <p className="text-sm text-gray-400 text-center">Purchase in Shop to unlock</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
