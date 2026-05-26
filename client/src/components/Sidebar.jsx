import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000'

const Sidebar = forwardRef(function Sidebar({ token, onSelectRequest, selectedRequest, onCollectionsLoad }, ref) {
  const [activeTab, setActiveTab] = useState('collections')
  const [collections, setCollections] = useState([])
  const [requests, setRequests] = useState({})
  const [expandedCollections, setExpandedCollections] = useState({})
  const [newCollectionName, setNewCollectionName] = useState('')
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useImperativeHandle(ref, () => ({
    refreshCollection(collectionId) {
      fetchRequests(collectionId, true)
      setExpandedCollections(prev => ({ ...prev, [collectionId]: true }))
    }
  }))

  useEffect(() => {
    fetchCollections()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory()
    }
  }, [activeTab])

  async function fetchCollections() {
    try {
      const res = await axios.get(`${API}/collections`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCollections(res.data.collections)
      onCollectionsLoad(res.data.collections)
    } catch (err) {
      console.error('Failed to fetch collections:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    setHistoryLoading(true)
    try {
      const res = await axios.get(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory(res.data.history)
    } catch (err) {
      console.error('Failed to fetch history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  async function clearHistory() {
    try {
      await axios.delete(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setHistory([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  async function fetchRequests(collectionId, force = false) {
    if (!force && requests[collectionId]) return
    try {
      const res = await axios.get(`${API}/requests/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(prev => ({ ...prev, [collectionId]: res.data.requests }))
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  }

  function toggleCollection(collectionId) {
    const isExpanded = expandedCollections[collectionId]
    setExpandedCollections(prev => ({ ...prev, [collectionId]: !isExpanded }))
    if (!isExpanded) {
      fetchRequests(collectionId)
    }
  }

  async function createCollection() {
    if (!newCollectionName.trim()) return
    try {
      const res = await axios.post(`${API}/collections`,
        { name: newCollectionName },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const updated = [...collections, res.data.collection]
      setCollections(updated)
      onCollectionsLoad(updated)
      setNewCollectionName('')
      setShowNewCollection(false)
    } catch (err) {
      console.error('Failed to create collection:', err)
    }
  }

  async function deleteCollection(e, collectionId) {
    e.stopPropagation()
    try {
      await axios.delete(`${API}/collections/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const updated = collections.filter(c => c.id !== collectionId)
      setCollections(updated)
      onCollectionsLoad(updated)
    } catch (err) {
      console.error('Failed to delete collection:', err)
    }
  }

  function loadFromHistory(item) {
    onSelectRequest({
      method: item.method,
      url: item.url,
      headers: item.headers || {},
      body: item.body || '',
      params: {},
      auth: {}
    })
  }

  function getStatusColor(status) {
    if (status >= 200 && status < 300) return 'text-green-400'
    if (status >= 300 && status < 400) return 'text-yellow-400'
    if (status >= 400) return 'text-red-400'
    return 'text-gray-400'
  }

  function timeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const methodColors = {
    GET: 'text-green-400',
    POST: 'text-yellow-400',
    PUT: 'text-blue-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400'
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'collections'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Collections
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          History
        </button>
      </div>

      {/* Collections tab */}
      {activeTab === 'collections' && (
        <>
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Collections</span>
            <button
              onClick={() => setShowNewCollection(true)}
              className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
              title="New Collection"
            >
              +
            </button>
          </div>

          {showNewCollection && (
            <div className="p-2 border-b border-gray-800">
              <input
                autoFocus
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createCollection()
                  if (e.key === 'Escape') setShowNewCollection(false)
                }}
                placeholder="Collection name..."
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1 mt-1">
                <button
                  onClick={createCollection}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewCollection(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-4 text-gray-500 text-xs text-center">Loading...</div>
            )}

            {!loading && collections.length === 0 && (
              <div className="p-4 text-gray-500 text-xs text-center">
                No collections yet. Create one above.
              </div>
            )}

            {collections.map(collection => (
              <div key={collection.id}>
                <div
                  onClick={() => toggleCollection(collection.id)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-gray-800 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400 text-xs">
                      {expandedCollections[collection.id] ? '▼' : '▶'}
                    </span>
                    <span className="text-gray-300 text-xs truncate">{collection.name}</span>
                  </div>
                  <button
                    onClick={(e) => deleteCollection(e, collection.id)}
                    className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ✕
                  </button>
                </div>

                {expandedCollections[collection.id] && (
                  <div>
                    {(requests[collection.id] || []).map(request => (
                      <div
                        key={request.id}
                        onClick={() => onSelectRequest(request)}
                        className={`flex items-center gap-2 pl-7 pr-3 py-1.5 cursor-pointer hover:bg-gray-800 ${
                          selectedRequest?.id === request.id ? 'bg-gray-800 border-l-2 border-blue-500' : ''
                        }`}
                      >
                        <span className={`text-xs font-mono font-bold w-10 shrink-0 ${methodColors[request.method] || 'text-gray-400'}`}>
                          {request.method}
                        </span>
                        <span className="text-gray-400 text-xs truncate">{request.name}</span>
                      </div>
                    ))}

                    {(requests[collection.id] || []).length === 0 && (
                      <div className="pl-7 py-1.5 text-gray-600 text-xs">No requests yet</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <>
          <div className="p-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent</span>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {historyLoading && (
              <div className="p-4 text-gray-500 text-xs text-center">Loading...</div>
            )}

            {!historyLoading && history.length === 0 && (
              <div className="p-4 text-gray-500 text-xs text-center">
                No history yet. Send a request first.
              </div>
            )}

            {history.map(item => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="px-3 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800/50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${methodColors[item.method] || 'text-gray-400'}`}>
                    {item.method}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${getStatusColor(item.status_code)}`}>
                      {item.status_code}
                    </span>
                    <span className="text-gray-600 text-xs">{timeAgo(item.created_at)}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-xs truncate font-mono">{item.url}</p>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  )
})

export default Sidebar