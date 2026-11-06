'use client';

import { useState } from 'react';
import { Milestone, INTERNAL_STAGES } from '@/lib/milestones';
import { formatDate, getMilestoneStatusColor } from '@/lib/utils';
import PhotoModal from './PhotoModal';
import styles from './unit-details.module.css';

interface Props {
  milestones: Milestone[];
  completedMilestones: Milestone[];
}

export default function UnitDetailsClient({
  milestones,
  completedMilestones,
}: Props) {
  const [activeTab, setActiveTab] = useState<'milestones' | 'photos'>('milestones');
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    milestone: Milestone | null;
    photoIndex: number;
  }>({
    isOpen: false,
    milestone: null,
    photoIndex: 0,
  });

  const toggleMilestone = (order: number) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  const openPhotoModal = (milestone: Milestone, index: number) => {
    setModalData({
      isOpen: true,
      milestone,
      photoIndex: index,
    });
  };

  const closePhotoModal = () => {
    setModalData({
      isOpen: false,
      milestone: null,
      photoIndex: 0,
    });
  };

  const navigatePhoto = (direction: number) => {
    if (!modalData.milestone) return;

    let newIndex = modalData.photoIndex + direction;

    if (newIndex < 0) {
      newIndex = modalData.milestone.pictures.length - 1;
    } else if (newIndex >= modalData.milestone.pictures.length) {
      newIndex = 0;
    }

    setModalData((prev) => ({
      ...prev,
      photoIndex: newIndex,
    }));
  };

  return (
    <>
      {/* Tabs Container */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'milestones' ? styles.active : ''}`}
            onClick={() => setActiveTab('milestones')}
          >
            🏗️ Construction Milestones
          </button>
          {/*
          <button
            className={`${styles.tabBtn} ${activeTab === 'photos' ? styles.active : ''}`}
            onClick={() => setActiveTab('photos')}
          >
            📷 Site Gallery
          </button>
          */}
        </div>

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <div className={styles.tabContent}>
            <div className={styles.timeline}>
              {milestones.map((milestone) => {
                const isExpanded = expandedMilestones.has(milestone.order);
                const statusColors = getMilestoneStatusColor(milestone.status);

                return (
                  <div key={milestone.order} className={styles.milestone}>
                    <div
                      className={`${styles.milestoneHeader} ${isExpanded ? styles.expanded : ''
                        }`}
                      onClick={() => toggleMilestone(milestone.order)}
                    >
                      <div className={styles.milestoneInfo}>
                        <div className={styles.milestoneName}>
                          {milestone.order}. {milestone.name}
                        </div>
                        <div className={styles.milestoneMeta}>
                          <span
                            className="status-pill"
                            style={{
                              background: statusColors.bg,
                              color: statusColors.text,
                            }}
                          >
                            {milestone.status}
                          </span>
                          {milestone.start_date && (
                            <span>Start: {formatDate(milestone.start_date)}</span>
                          )}
                          {milestone.end_date && (
                            <span>End: {formatDate(milestone.end_date)}</span>
                          )}
                          {milestone.progress > 0 && (
                            <span>{milestone.progress}% Complete</span>
                          )}
                        </div>
                      </div>
                      <div
                        className={styles.milestoneArrow}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        ▼
                      </div>
                    </div>

                    {isExpanded && (
                      <div className={styles.milestoneDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Start Date</span>
                          <span className={styles.detailValue}>
                            {formatDate(milestone.start_date)}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>End Date</span>
                          <span className={styles.detailValue}>
                            {formatDate(milestone.end_date)}
                          </span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Progress</span>
                          <span className={styles.detailValue}>{milestone.progress}%</span>
                        </div>

                        {/* Photos */}
                        {/*
                        {milestone.pictures.length > 0 && (
                          <div className={styles.photoGallery}>
                            <div className={styles.detailLabel}>
                              📷 Site Pictures ({milestone.pictures.length})
                            </div>
                            <div className={styles.galleryGrid}>
                              {milestone.pictures.map((picture, index) => (
                                <div
                                  key={picture.id}
                                  className={styles.galleryThumb}
                                  onClick={() => openPhotoModal(milestone, index)}
                                >
                                  <img
                                    src={picture.url}
                                    alt={milestone.name}
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23f1f5f9\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%2364748b\' font-size=\'14\'%3EImage unavailable%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        */}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {/*
        {activeTab === 'photos' && (
          <div className={styles.tabContent}>
            {completedMilestones.length > 0 ? (
              <div className={styles.photoGalleryTab}>
                {completedMilestones.map((milestone) =>
                  milestone.pictures.length > 0 ? (
                    <div
                      key={milestone.order}
                      className={styles.galleryMilestoneCard}
                      onClick={() => openPhotoModal(milestone, 0)}
                    >
                      <div className={styles.cardThumbnail}>
                        <img
                          src={milestone.pictures[0].url}
                          alt={milestone.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Crect fill=\'%23f3f4f6\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%236b7280\' font-size=\'14\'%3EImage unavailable%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        {milestone.pictures.length > 1 && (
                          <div className={styles.photoCount}>
                            +{milestone.pictures.length - 1} more
                          </div>
                        )}
                      </div>
                      <div className={styles.cardBody}>
                        <h3>{milestone.name}</h3>
                        <div className={styles.cardMeta}>
                          <span className="badge badge-success">{milestone.status}</span>
                          <span>•</span>
                          <span>
                            📷 {milestone.pictures.length} photo
                            {milestone.pictures.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        {milestone.end_date && (
                          <div className={styles.cardDate}>
                            Completed: {formatDate(milestone.end_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3>No Progress Photos Yet</h3>
                <p>Photos will appear here once construction milestones are completed.</p>
              </div>
            )}
          </div>
        )}
        */}
      </div>

      {/* Photo Modal */}
      <PhotoModal
        isOpen={modalData.isOpen}
        milestone={modalData.milestone}
        photoIndex={modalData.photoIndex}
        onClose={closePhotoModal}
        onNavigate={navigatePhoto}
      />
    </>
  );
}
