import { useState } from 'react'
import { useChannelStore } from '@stores/channelStore'
import { useAuthStore } from '@stores/authStore'
import Avatar from '@ui/Avatar'
import InviteMemberModal from './InviteMemberModal'
import styles from './MemberList.module.css'

export default function MemberList({ onUserClick }) {
  const members = useChannelStore((s) => s.members)
  const removeMember = useChannelStore((s) => s.removeMember)
  const currentUser = useAuthStore((s) => s.user)
  const [inviteOpen, setInviteOpen] = useState(false)

  const myRole = members.find((m) => m.userId === currentUser?.userId)?.role
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'

  const online = members.filter((m) => m.online)
  const offline = members.filter((m) => !m.online)

  return (
    <div>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionLabel}>👥 멤버 ({members.length})</span>
        {canManage && (
          <button className={styles.inviteBtn} onClick={() => setInviteOpen(true)} title="멤버 초대">
            +
          </button>
        )}
      </div>

      {online.length > 0 && (
        <>
          <div className={styles.groupLabel}>온라인 — {online.length}</div>
          {online.map((m) => (
            <MemberItem
              key={m.userId}
              member={m}
              canRemove={canManage && m.userId !== currentUser?.userId}
              onClick={onUserClick}
              onRemove={removeMember}
            />
          ))}
        </>
      )}

      {offline.length > 0 && (
        <>
          <div className={styles.groupLabel} style={{ marginTop: 10 }}>오프라인 — {offline.length}</div>
          {offline.map((m) => (
            <MemberItem
              key={m.userId}
              member={m}
              canRemove={canManage && m.userId !== currentUser?.userId}
              onClick={onUserClick}
              onRemove={removeMember}
            />
          ))}
        </>
      )}

      {inviteOpen && <InviteMemberModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}

function MemberItem({ member, canRemove, onClick, onRemove }) {
  const [removing, setRemoving] = useState(false)

  async function handleRemove(e) {
    e.stopPropagation()
    setRemoving(true)
    try {
      await onRemove(member.userId)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={styles.item} onClick={() => onClick?.(member.userId)}>
      <Avatar size="sm" colorKey={member.colorKey ?? 'indigo'} label={member.initials} />
      <span className={styles.name}>{member.displayName}</span>
      {member.online && <div className={styles.dot} />}
      {member.role && <span className={styles.role}>{member.role}</span>}
      {canRemove && (
        <button
          className={styles.removeBtn}
          disabled={removing}
          onClick={handleRemove}
          title="멤버 제거"
        >
          ✕
        </button>
      )}
    </div>
  )
}
