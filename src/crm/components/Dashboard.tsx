import Sidebar from './Sidebar'
import DashboardContent from './DashboardContent'
import PipelineContent from './PipelineContent'
import LeadsContent from './LeadsContent'
import LeadProfile from './LeadProfile'
import PreTherapyBookings from './PreTherapyBookings'
import { AdminEditProfile } from '../../../components/AdminEditProfile'
import { ChangePassword } from '../../../components/ChangePassword'
import ToDoModal from './ToDoModal'

interface DashboardProps {
  currentPage: string
  setCurrentPage: (page: string) => void
  currentUser: any
  onLogout?: () => void
}

const Dashboard = ({ currentPage, setCurrentPage, currentUser, onLogout }: DashboardProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 flex-shrink-0">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} onLogout={onLogout} />
      </div>
      <div className={`flex-1 ${currentPage === 'pipeline' ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
        {currentPage === 'analytics' && <DashboardContent currentUser={currentUser} setCurrentPage={setCurrentPage} />}
        {currentPage === 'pipeline' && <PipelineContent currentUser={currentUser} setCurrentPage={setCurrentPage} />}
        {currentPage === 'leads' && <LeadsContent setCurrentPage={setCurrentPage} />}
        {currentPage.startsWith('lead-profile:') && (
          <LeadProfile
            leadId={currentPage.split(':')[1]}
            onBack={() => setCurrentPage('leads')}
            currentUser={currentUser}
          />
        )}
        {currentPage === 'pretherapy' && <PreTherapyBookings currentUser={currentUser} setCurrentPage={setCurrentPage} />}
        {currentPage === 'full-todo' && (
          <ToDoModal 
            isFullPage={true} 
            setCurrentPage={setCurrentPage}
            onViewLead={(leadId) => setCurrentPage(`lead-profile:${leadId}`)}
          />
        )}
        {currentPage === 'settings' && (
          <AdminEditProfile user={currentUser} onBack={() => setCurrentPage('analytics')} />
        )}
        {currentPage === 'changePassword' && (
          <ChangePassword user={currentUser} onBack={() => setCurrentPage('analytics')} />
        )}
      </div>
    </div>
  )
}

export default Dashboard
