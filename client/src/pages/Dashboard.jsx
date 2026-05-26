import { useState, useRef } from 'react'
import axios from 'axios'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import RequestBuilder from '../components/RequestBuilder'
import ResponseViewer from '../components/ResponseViewer'

const API = 'http://localhost:3000'

function Dashboard({ token, onLogout }) {
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [response, setResponse] = useState(null)
  const [collections, setCollections] = useState([])
  const sidebarRef = useRef(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  async function handleSaveRequest(requestData) {
    try {
      await axios.post(`${API}/requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Tell sidebar to refresh the collection where request was saved
      if (sidebarRef.current) {
        sidebarRef.current.refreshCollection(requestData.collection_id)
      }
    } catch (err) {
      console.error('Failed to save request:', err)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      <Topbar user={user} onLogout={onLogout} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          ref={sidebarRef}
          token={token}
          onSelectRequest={setSelectedRequest}
          selectedRequest={selectedRequest}
          onCollectionsLoad={setCollections}
        />
        <RequestBuilder
          token={token}
          selectedRequest={selectedRequest}
          onResponse={setResponse}
          onSaveRequest={handleSaveRequest}
          collections={collections}
        />
        <ResponseViewer response={response} />
      </div>
    </div>
  )
}

export default Dashboard