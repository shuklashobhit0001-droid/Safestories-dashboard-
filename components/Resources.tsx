import React, { useState } from 'react';
import { Clock, User, Users, Copy, MoreVertical, FileText, Check, ExternalLink, QrCode, Settings as SettingsIcon } from 'lucide-react';
import { therapistData } from '../lib/sessionData';
import './Resources.css';

interface ResourceCardProps {
  title: string;
  duration: string;
  type: 'one_on_one' | 'group';
  description: string;
  slug: string;
  label: string;
  charges: string;
  detailedDescription: string;
  editViewDescription?: string;
  onEdit?: (tab?: string) => void;
  onViewBooking?: () => void;
}

const ServiceCard: React.FC<ResourceCardProps> = ({ 
  title, duration, type, description, slug, label, charges, detailedDescription, editViewDescription, onEdit, onViewBooking 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://safestories.in${slug}`);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowDropdown(false);
    }, 2000);
  };

  const formatDescription = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => 
      index % 2 === 1 ? <strong key={index}>{part}</strong> : part
    );
  };

  return (
    <div className="service-card">
      <div className="card-header">
        <h3 className="card-title" onClick={() => onEdit?.('Basic')} style={{ cursor: 'pointer' }}>{title}</h3>
        <div className="more-btn" onClick={() => setShowDropdown(!showDropdown)}>
          <MoreVertical size={20} />
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => onEdit?.('Schedule')}>
                <Clock size={16} />
                Edit Schedule
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tag-bar">
        <div className="tag">
          <Clock size={14} />
          {duration}
        </div>
        <div className="tag">
          {type === 'one_on_one' ? <User size={14} /> : <Users size={14} />}
          {type}
        </div>
      </div>

      <div className="card-description">
        {formatDescription(description)}
      </div>

      <div className="card-footer">
        <div className="slug-container">
          <span className="slug-text">{label}</span>
          <button 
            className="copy-btn" 
            title="Open public booking page" 
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/book${slug}`, '_blank');
            }}
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Resources: React.FC<{ 
  therapistName?: string, 
  onEditEvent?: (event: any) => void,
  onViewBooking?: (session: any) => void 
}> = ({ 
  therapistName = "Ishika Mahajan", 
  onEditEvent,
  onViewBooking
}) => {
  const [urlCopied, setUrlCopied] = useState(false);

  const currentData = therapistData[therapistName] || therapistData["Ishika Mahajan"];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentData.url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <div className="resources-container">
      <header className="resources-header">
        <div className="header-main">
          <div className="header-left">
            <h1 className="therapist-name">{therapistName}</h1>
          </div>
        </div>
      </header>

      <div className="resources-grid">
        {currentData.services.map((service, index) => (
          <ServiceCard 
            key={index} 
            {...service} 
            onEdit={(tab) => onEditEvent?.({ ...service, owner: therapistName, initialTab: tab })}
            onViewBooking={() => onViewBooking?.({ ...service, owner: therapistName })}
          />
        ))}
      </div>
    </div>
  );
};

export default Resources;
