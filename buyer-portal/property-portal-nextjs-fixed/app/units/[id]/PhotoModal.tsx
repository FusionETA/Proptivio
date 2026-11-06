'use client';

import { useEffect } from 'react';
import { Milestone } from '@/lib/milestones';
import styles from './photo-modal.module.css';

interface Props {
  isOpen: boolean;
  milestone: Milestone | null;
  photoIndex: number;
  onClose: () => void;
  onNavigate: (direction: number) => void;
}

export default function PhotoModal({
  isOpen,
  milestone,
  photoIndex,
  onClose,
  onNavigate,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate(-1);
      } else if (e.key === 'ArrowRight') {
        onNavigate(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen || !milestone || !milestone.pictures[photoIndex]) {
    return null;
  }

  const photo = milestone.pictures[photoIndex];

  return (
    <div className={`${styles.modal} ${styles.active}`} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>
          ×
        </button>
        <button className={`${styles.modalNav} ${styles.prev}`} onClick={() => onNavigate(-1)}>
          ‹
        </button>
        <button className={`${styles.modalNav} ${styles.next}`} onClick={() => onNavigate(1)}>
          ›
        </button>
        <img
          src={photo.url}
          alt={milestone.name}
          onError={(e) => {
            e.currentTarget.src =
              'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'600\'%3E%3Crect fill=\'%23111827\' width=\'600\' height=\'600\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' fill=\'%23fff\' font-size=\'20\'%3EImage unavailable%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className={styles.modalInfo}>
          {milestone.name} - Photo {photoIndex + 1} of {milestone.pictures.length}
        </div>
      </div>
    </div>
  );
}
