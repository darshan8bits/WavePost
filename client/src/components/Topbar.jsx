function Topbar({ user, onLogout }) {
  return (
    <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">W</span>
        </div>
        <span className="text-white font-semibold text-sm">WavePost</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs">{user?.email}</span>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>

    </div>
  )
}

export default Topbar