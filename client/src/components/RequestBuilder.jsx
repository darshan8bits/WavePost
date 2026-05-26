import { useState, useEffect } from 'react'
import axios from 'axios'

const API = 'http://localhost:3000'

function RequestBuilder({ token, selectedRequest, onResponse, onSaveRequest, collections }) {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('')
  const [activeTab, setActiveTab] = useState('params')
  const [params, setParams] = useState([{ key: '', value: '' }])
  const [headers, setHeaders] = useState([{ key: '', value: '' }])
  const [body, setBody] = useState('')
  const [authType, setAuthType] = useState('none')
  const [authToken, setAuthToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveModal, setSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveCollection, setSaveCollection] = useState('')

  // When a saved request is selected from sidebar, load it
  useEffect(() => {
    if (selectedRequest) {
      setMethod(selectedRequest.method || 'GET')
      setUrl(selectedRequest.url || '')
      setBody(selectedRequest.body || '')

      const h = selectedRequest.headers || {}
      const hArr = Object.entries(h).map(([key, value]) => ({ key, value }))
      setHeaders(hArr.length > 0 ? hArr : [{ key: '', value: '' }])

      const p = selectedRequest.params || {}
      const pArr = Object.entries(p).map(([key, value]) => ({ key, value }))
      setParams(pArr.length > 0 ? pArr : [{ key: '', value: '' }])

      const auth = selectedRequest.auth || {}
      setAuthType(auth.type || 'none')
      setAuthToken(auth.token || '')
    }
  }, [selectedRequest])

  function buildUrl() {
    const validParams = params.filter(p => p.key.trim())
    if (validParams.length === 0) return url
    const queryString = validParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
    return `${url}?${queryString}`
  }

  function buildHeaders() {
    const result = {}
    headers.filter(h => h.key.trim()).forEach(h => {
      result[h.key] = h.value
    })
    if (authType === 'bearer' && authToken) {
      result['Authorization'] = `Bearer ${authToken}`
    } else if (authType === 'basic' && authToken) {
      result['Authorization'] = `Basic ${btoa(authToken)}`
    }
    return result
  }

  async function sendRequest() {
    if (!url.trim()) return
    setLoading(true)
    const startTime = Date.now()

    try {
      const finalUrl = buildUrl()
      const finalHeaders = buildHeaders()

      const config = {
        method: method.toLowerCase(),
        url: finalUrl,
        headers: finalHeaders,
      }

      if (['post', 'put', 'patch'].includes(method.toLowerCase()) && body) {
        try {
          config.data = JSON.parse(body)
          config.headers['Content-Type'] = 'application/json'
        } catch {
          config.data = body
        }
      }

      const res = await axios(config)
      const responseTime = Date.now() - startTime

      onResponse({
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        time: responseTime,
        size: JSON.stringify(res.data).length
      })

      // Save to history
      await axios.post(`${API}/history`, {
        method,
        url: finalUrl,
        headers: finalHeaders,
        body,
        status_code: res.status,
        response_time: responseTime,
        response_body: JSON.stringify(res.data),
        response_headers: res.headers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

    } catch (err) {
      const responseTime = Date.now() - startTime
      if (err.response) {
        onResponse({
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers,
          time: responseTime,
          size: JSON.stringify(err.response.data).length,
          isError: true
        })
      } else {
        onResponse({
          status: 0,
          statusText: 'Network Error',
          data: { error: err.message },
          headers: {},
          time: responseTime,
          size: 0,
          isError: true
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveRequest() {
    if (!saveName.trim() || !saveCollection) return
    try {
      await onSaveRequest({
        collection_id: parseInt(saveCollection),
        name: saveName,
        method,
        url,
        headers: Object.fromEntries(headers.filter(h => h.key).map(h => [h.key, h.value])),
        body,
        params: Object.fromEntries(params.filter(p => p.key).map(p => [p.key, p.value])),
        auth: { type: authType, token: authToken }
      })
      setSaveModal(false)
      setSaveName('')
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  function updateParam(index, field, value) {
    const updated = [...params]
    updated[index][field] = value
    if (index === params.length - 1 && value) {
      updated.push({ key: '', value: '' })
    }
    setParams(updated)
  }

  function updateHeader(index, field, value) {
    const updated = [...headers]
    updated[index][field] = value
    if (index === headers.length - 1 && value) {
      updated.push({ key: '', value: '' })
    }
    setHeaders(updated)
  }

  const methodColors = {
    GET: 'text-green-400',
    POST: 'text-yellow-400',
    PUT: 'text-blue-400',
    PATCH: 'text-orange-400',
    DELETE: 'text-red-400'
  }

  const tabs = ['params', 'headers', 'body', 'auth']

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-gray-950">

      {/* URL Bar */}
      <div className="p-3 border-b border-gray-800 flex gap-2">
        
        {/* Method selector */}
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 cursor-pointer ${methodColors[method]}`}
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* URL input */}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
        />

        {/* Save button */}
        <button
          onClick={() => setSaveModal(true)}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-3 py-2 rounded-lg transition-colors"
        >
          Save
        </button>

        {/* Send button */}
        <button
          onClick={sendRequest}
          disabled={loading || !url.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>

      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-3">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-medium capitalize transition-colors border-b-2 ${
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

        {/* Params tab */}
        {activeTab === 'params' && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Query parameters are appended to the URL automatically.</p>
            <div className="space-y-1">
              {params.map((param, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={param.key}
                    onChange={(e) => updateParam(i, 'key', e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <input
                    value={param.value}
                    onChange={(e) => updateParam(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Headers tab */}
        {activeTab === 'headers' && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Add custom request headers.</p>
            <div className="space-y-1">
              {headers.map((header, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={header.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                    placeholder="Header name"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <input
                    value={header.value}
                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body tab */}
        {activeTab === 'body' && (
          <div className="h-full">
            <p className="text-xs text-gray-500 mb-3">Request body — use JSON format for most APIs.</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500 font-mono resize-none"
            />
          </div>
        )}

        {/* Auth tab */}
        {activeTab === 'auth' && (
          <div>
            <p className="text-xs text-gray-500 mb-3">Authentication is added to request headers automatically.</p>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-3"
            >
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>

            {authType !== 'none' && (
              <input
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder={authType === 'bearer' ? 'Enter token...' : 'username:password'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            )}
          </div>
        )}

      </div>

      {/* Save modal */}
      {saveModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Save Request</h3>

            <div className="space-y-3">
              <input
                autoFocus
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Request name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <select
                value={saveCollection}
                onChange={(e) => setSaveCollection(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select collection...</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={saveRequest}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setSaveModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default RequestBuilder