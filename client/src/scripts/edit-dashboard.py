import re
import sys

def edit_file():
    with open('c:/Users/kalab/artfully/client/src/pages/DashboardPage.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find where return ( starts
    start_idx = content.find('  return (\n    <div className="max-w-6xl mx-auto px-4 py-8">')
    if start_idx == -1:
        print("Could not find start index")
        return
    
    new_return_block = """  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Navigation Panel (Left Side) */}
        <aside className="w-full md:w-64 shrink-0">
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary-500" />
              Quick Links
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/hall-of-fame')}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-primary-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Wonder Hall</div>
                  <div className="text-sm text-gray-500">View legendary masterpieces</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/practice')}
                className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-accent-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Practice Mode</div>
                  <div className="text-sm text-gray-500">Improve your drawing skills</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Avatar
                src={profile?.avatarUrl}
                alt={displayName}
                size="lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {displayName}!
                </h1>
                <p className="text-gray-500">@{username}</p>
              </div>
            </div>
          </div>

          {/* Play Actions */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary-500" />
              Play
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => startMatchmaking('normal')}
                className="group p-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white text-left hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Normal Play</h3>
                <p className="text-primary-100 text-sm">3 rounds, 90 seconds per turn</p>
              </button>

              <button
                onClick={() => startMatchmaking('quick')}
                className="group p-6 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl text-white text-left hover:from-secondary-600 hover:to-secondary-700 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Quick Play</h3>
                <p className="text-secondary-100 text-sm">2 rounds, 60 seconds per turn</p>
              </button>

              <button
                onClick={() => setShowCreate(true)}
                className="group p-6 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl text-white text-left hover:from-accent-600 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Settings2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Custom Lobby</h3>
                <p className="text-accent-100 text-sm">Create with your own settings</p>
              </button>
            </div>
          </section>

          {/* Feedback */}
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              Send Us Feedback
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-2">
                  {([
                    { value: 'bug', label: 'Bug' },
                    { value: 'feedback', label: 'Feedback' },
                    { value: 'suggestion', label: 'Suggestion' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFeedbackType(value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${feedbackType === value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  maxLength={2000}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-vertical"
                />
                <p className="text-xs text-gray-400 mt-1">{feedbackMessage.length}/2000</p>
              </div>

              {feedbackStatus && (
                <div className={`p-3 rounded-lg text-sm ${feedbackStatus.type === 'success'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
                  }`}>
                  {feedbackStatus.message}
                </div>
              )}

              <Button
                onClick={handleFeedbackSubmit}
                isLoading={feedbackSubmitting}
                disabled={!feedbackMessage.trim() || feedbackSubmitting}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                Submit Feedback
              </Button>
            </div>
          </Card>
        </main>
      </div>

      {/* Announcement */}
      <AnnouncementModal />

      {/* Modals */}
      <CreateLobbyModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      <MatchmakingModal
        isOpen={showMatchmaking}
        onClose={() => setShowMatchmaking(false)}
        onMatched={handleMatched}
        gameMode={matchmakingMode}
      />
    </div>
  );
}
"""

    end_idx = content.find('  );\n}\n') + len('  );\n}\n')
    
    new_content = content[:start_idx] + new_return_block
    
    with open('c:/Users/kalab/artfully/client/src/pages/DashboardPage.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print("Successfully updated DashboardPage.tsx")

if __name__ == "__main__":
    edit_file()
