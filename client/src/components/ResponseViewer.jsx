import { useState } from 'react'

function ResponseViewer({ response }) {

  const [activeTab, setActiveTab] = useState('pretty')

  if (!response) {
    return (
      <div className="w-80 bg-gray-900 border-l border-gray-800 flex items-center justify-center shrink-0">
        <div className="text-center">
          <div className="text-4xl mb-3">↗</div>
          <p className="text-gray-500 text-sm">Send a request to see the response</p>
        </div>
      </div>
    )
  }

  function getStatusColor(status) {
    if (status >= 200 && status < 300) return 'text-green-400'
    if (status >= 300 && status < 400) return 'text-yellow-400'
    if (status >= 400 && status < 500) return 'text-red-400'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-400'
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  function prettyJson(data) {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  function renderPrettyJson(data, depth = 0) {
    if (data === null) return <span className="text-gray-400">null</span>
    if (typeof data === 'boolean') return <span className="text-yellow-400">{String(data)}</span>
    if (typeof data === 'number') return <span className="text-blue-400">{data}</span>
    if (typeof data === 'string') return <span className="text-green-400">"{data}"</span>

    if (Array.isArray(data)) {
      if (data.length === 0) return <span className="text-gray-400">[]</span>
      return (
        <span>
          {'['}
          <div style={{ marginLeft: `${(depth + 1) * 16}px` }}>
            {data.map((item, i) => (
              <div key={i}>
                {renderPrettyJson(item, depth + 1)}
                {i < data.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
          <span style={{ marginLeft: `${depth * 16}px` }}>{']'}</span>
        </span>
      )
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data)
      if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>
      return (
        <span>
          {'{'}
          <div style={{ marginLeft: `${(depth + 1) * 16}px` }}>
            {entries.map(([key, value], i) => (
              <div key={key}>
                <span className="text-purple-400">"{key}"</span>
                <span className="text-gray-400">: </span>
                {renderPrettyJson(value, depth + 1)}
                {i < entries.length - 1 && <span className="text-gray-500">,</span>}
              </div>
            ))}
          </div>
          <span style={{ marginLeft: `${depth * 16}px` }}>{'}'}</span>
        </span>
      )
    }

    return <span className="text-gray-300">{String(data)}</span>
  }

  const tabs = ['pretty', 'raw', 'headers']

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">

      {/* Status bar */}
      <div className="p-3 border-b border-gray-800 flex items-center gap-3">
        <span className={`text-sm font-bold ${getStatusColor(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-gray-500 text-xs">{response.time}ms</span>
        <span className="text-gray-500 text-xs">{formatSize(response.size)}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-3">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">

        {/* Pretty tab */}
        {activeTab === 'pretty' && (
          <pre className="text-xs font-mono leading-relaxed">
            {renderPrettyJson(response.data)}
          </pre>
        )}

        {/* Raw tab */}
        {activeTab === 'raw' && (
          <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
            {prettyJson(response.data)}
          </pre>
        )}

        {/* Headers tab */}
        {activeTab === 'headers' && (
          <div className="space-y-1">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="flex gap-2 text-xs">
                <span className="text-purple-400 font-mono shrink-0">{key}:</span>
                <span className="text-gray-300 font-mono break-all">{value}</span>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  )
}

export default ResponseViewer